const express = require("express");
const router = express.Router();

const {
  addOrder,
  getAllOrders,
  searchOrders,
  updateOrderStatus,
  deleteOrder,
  getMyOrders, 
} = require("../controllers/orderController");

const Order = require("../models/Order");

const { protect, restrictTo } = require("../middleware/authMiddleware");

// State change validation function (moved from controller for reuse)
const validateStateChange = (userRole, currentState, newState) => {
  const stateTransitionRules = {
    admin: {
      'Pending': ['Processing', 'On the Way', 'Delivered', 'Cancelled'],
      'Processing': ['Pending', 'On the Way', 'Delivered', 'Cancelled'],
      'On the Way': ['Pending', 'Processing', 'Delivered', 'Cancelled'],
      'Delivered': ['Pending', 'Processing', 'On the Way', 'Cancelled'],
      'Cancelled': ['Pending', 'Processing', 'On the Way', 'Delivered']
    },
    employee: {
      'Pending': ['Processing', 'Cancelled'],
      'Processing': ['Cancelled'],
      'On the Way': [],
      'Delivered': [],
      'Cancelled': []
    },
    merchant: {
      'Pending': ['Cancelled'],
      'Processing': [],
      'On the Way': [],
      'Delivered': [],
      'Cancelled': []
    },
    courier: {
      'Pending': [],
      'Processing': ['On the Way'],
      'On the Way': ['Delivered'],
      'Delivered': [],
      'Cancelled': []
    }
  };

  const allowedTransitions = stateTransitionRules[userRole]?.[currentState] || [];
  
  if (!allowedTransitions.includes(newState)) {
    let errorMessage = "Unauthorized state transition.";
    
    switch (userRole) {
      case 'employee':
        if (currentState === 'Pending') {
          errorMessage = "Employee can only move orders from Pending to Processing or cancel them.";
        } else if (currentState === 'Processing') {
          errorMessage = "Employee can only cancel orders that haven't been shipped yet.";
        } else {
          errorMessage = "Employee cannot modify orders in this state.";
        }
        break;
        
      case 'merchant':
        if (currentState === 'Pending') {
          errorMessage = "Merchant can only cancel orders that employees haven't started processing yet.";
        } else {
          errorMessage = "Merchant cannot modify orders once processing has started.";
        }
        break;
        
      case 'courier':
        errorMessage = "Delivery can only move orders from Processing → On the Way → Delivered.";
        break;
    }
    
    return { success: false, message: errorMessage, error: "UNAUTHORIZED_TRANSITION" };
  }

  return { success: true, message: "State transition authorized." };
};

router.use(protect);

router.post("/add", restrictTo("employee", "merchant"), addOrder);


router.get("/", restrictTo("admin", "employee"), getAllOrders);


router.get("/my-orders", restrictTo("merchant"), getMyOrders);

router.get("/search", restrictTo("admin", "employee"), searchOrders);

router.patch(
  "/:id/status",
  restrictTo("admin", "employee", "merchant", "courier"),
  updateOrderStatus
);

// Get order state history
router.get(
  "/:id/state-history",
  restrictTo("admin", "employee", "merchant", "courier"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const order = await Order.findById(id)
        .select('stateHistory')
        .populate('stateHistory.changedBy', 'fullName userType email');
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.status(200).json({
        success: true,
        data: { stateHistory: order.stateHistory }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching state history",
        error: error.message
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
      const validateResult = validateStateChange(userRole, currentState, newState);
      
      res.status(200).json({
        success: validateResult.success,
        message: validateResult.message,
        canChange: validateResult.success,
        currentState,
        requestedState: newState
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error validating state change",
        error: error.message
      });
    }
  }
);

router.delete(
  "/:id",
  restrictTo("employee"), 
  deleteOrder
);

module.exports = router; 