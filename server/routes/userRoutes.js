const express = require("express");
const router = express.Router();
const {
  addUser,
  getUsers,
  updateUser,
  deleteUser,
  getUsersWithSearch,
  searchMerchants
} = require("../controllers/userController");

const { protect, restrictTo } = require("../middleware/authMiddleware");
router.use(protect); 
router.get("/merchants/search", restrictTo("admin", "employee"), searchMerchants);
router.use(restrictTo("admin"));
router.get("/", getUsers);

router.get("/search", getUsersWithSearch);

router.post("/add", addUser);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

module.exports = router;