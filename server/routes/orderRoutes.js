const express = require("express");
const router = express.Router();

const {
  addOrder,
  getAllOrders,
  searchOrders,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

const { protect, restrictTo } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/add", restrictTo("employee", "merchant"), addOrder);

router.get("/", restrictTo("admin", "employee"), getAllOrders);

router.get("/search", restrictTo("admin", "employee"), searchOrders);
router.patch(
  "/:id/status",
  restrictTo("admin", "employee"),
  updateOrderStatus
);


router.delete(
  "/:id",
  restrictTo("employee"),
  deleteOrder
);
module.exports = router;