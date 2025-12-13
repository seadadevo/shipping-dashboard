const express = require("express");
const router = express.Router();

const {
  addOrder,
  getAllOrders,
  searchOrders,
  updateOrderStatus,
  deleteOrder,
  getMyOrders,
  calculateCost,
} = require("../controllers/orderController");

const Order = require("../models/Order");

const { protect, restrictTo } = require("../middleware/authMiddleware");

// State change validation function (moved from controller for reuse)
const validateStateChange = (userRole, currentState, newState) => {
  const stateTransitionRules = {
    admin: {
      Pending: ["Processing", "On the Way", "Delivered", "Cancelled"],
      Processing: ["Pending", "On the Way", "Delivered", "Cancelled"],
      "On the Way": ["Pending", "Processing", "Delivered", "Cancelled"],
      Delivered: ["Pending", "Processing", "On the Way", "Cancelled"],
      Cancelled: ["Pending", "Processing", "On the Way", "Delivered"],
    },
    employee: {
      Pending: ["Processing", "Cancelled"],
      Processing: ["Pending", "Cancelled"],
      "On the Way": [],
      Delivered: [],
      Cancelled: [],
    },
    merchant: {
      Pending: ["Cancelled"],
      Processing: [],
      "On the Way": [],
      Delivered: [],
      Cancelled: [],
    },
    courier: {
      Pending: [],
      Processing: ["On the Way", "Delivered"],
      "On the Way": ["Processing", "Delivered"],
      Delivered: [],
      Cancelled: [],
    },
  };

  const allowedTransitions =
    stateTransitionRules[userRole]?.[currentState] || [];

  if (!allowedTransitions.includes(newState)) {
    let errorMessage = "Unauthorized state transition.";

    switch (userRole) {
      case "employee":
        if (currentState === "Pending") {
          errorMessage =
            "الموظف يمكنه فقط نقل الطلبات من قيد الانتظار إلى قيد المعالجة أو إلغائها";
        } else if (currentState === "Processing") {
          errorMessage =
            "الموظف يمكنه إرجاع الطلب إلى قيد الانتظار أو إلغائه فقط";
        } else {
          errorMessage = "الموظف لا يمكنه تعديل الطلبات في هذه الحالة";
        }
        break;

      case "merchant":
        if (currentState === "Pending") {
          errorMessage =
            "Merchant can only cancel orders that employees haven't started processing yet.";
        } else {
          errorMessage =
            "Merchant cannot modify orders once processing has started.";
        }
        break;

      case "courier":
        errorMessage =
          "Delivery can only move orders from Processing → On the Way → Delivered.";
        break;
    }

    return {
      success: false,
      message: errorMessage,
      error: "UNAUTHORIZED_TRANSITION",
    };
  }

  return { success: true, message: "State transition authorized." };
};

router.use(protect);

router.post("/add", restrictTo("employee", "merchant"), addOrder);

router.post(
  "/calculate-cost",
  restrictTo("admin", "employee", "merchant"),
  calculateCost
);

router.get("/", restrictTo("admin", "employee"), getAllOrders);

router.get("/my-orders", restrictTo("merchant"), getMyOrders);

router.get("/search", restrictTo("admin", "employee"), searchOrders);

router.patch(
  "/:id/status",
  restrictTo("admin", "employee", "merchant", "courier"),
  updateOrderStatus
);

// Assign driver to order and update status to Processing
router.patch(
  "/:id/assign-driver",
  restrictTo("admin", "employee"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { driverId, status } = req.body;
      const userId = req.user._id;

      if (!driverId) {
        return res.status(400).json({ message: "معرف السائق مطلوب" });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      // Update order with driver and status
      order.assignedDriver = driverId;
      order.status = status || "Processing";

      // Add to state history
      order.stateHistory.push({
        previousState: order.status,
        newState: status || "Processing",
        changedBy: userId,
        changeReason: `تعيين السائق وتحويل الطلب إلى قيد المعالجة`,
        changedAt: new Date(),
      });

      await order.save();

      const populatedOrder = await Order.findById(id)
        .populate("assignedDriver", "fullName phoneNumber")
        .populate("stateHistory.changedBy", "fullName userType");

      res.status(200).json({
        success: true,
        message: "تم تعيين السائق بنجاح",
        data: { order: populatedOrder },
      });
    } catch (error) {
      console.error("Assign driver error:", error);
      res.status(500).json({
        message: "خطأ في الخادم أثناء تعيين السائق",
        error: error.message,
      });
    }
  }
);

// Get order state history
router.get(
  "/:id/state-history",
  restrictTo("admin", "employee", "merchant", "courier"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const order = await Order.findById(id)
        .select("stateHistory")
        .populate("stateHistory.changedBy", "fullName userType email");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json({
        success: true,
        data: { stateHistory: order.stateHistory },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching state history",
        error: error.message,
      });
    }
  }
);

// Validate state change
router.post(
  "/:id/validate-state-change",
  restrictTo("admin", "employee", "merchant", "courier"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newState } = req.body;
      const userRole = req.user.userType;

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const currentState = order.status;
      const validateResult = validateStateChange(
        userRole,
        currentState,
        newState
      );

      res.status(200).json({
        success: validateResult.success,
        message: validateResult.message,
        canChange: validateResult.success,
        currentState,
        requestedState: newState,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error validating state change",
        error: error.message,
      });
    }
  }
);

router.delete("/:id", restrictTo("admin"), deleteOrder);

module.exports = router;
