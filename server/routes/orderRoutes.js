const express = require("express");
const router = express.Router();

const {
  addOrder,
  getAllOrders,
  searchOrders,
} = require("../controllers/orderController");

const { protect, restrictTo } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/add", restrictTo("employee", "merchant"), addOrder);

router.get("/", restrictTo("admin", "employee"), getAllOrders);

router.get("/search", restrictTo("admin", "employee"), searchOrders);

module.exports = router;
