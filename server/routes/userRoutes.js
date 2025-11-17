const express = require("express");
const router = express.Router();
const {
  addUser,
  getUsers,
  updateUser,
  deleteUser,
  getUsersWithSearch,
} = require("../controllers/userController");

const { protect, restrictTo } = require("../middleware/authMiddleware");

router.use(protect); 

router.get("/", restrictTo("admin", "employee"),  getUsers);

router.get("/search", restrictTo("admin"), getUsersWithSearch);

router.post("/add", restrictTo("admin"), addUser);

router.put("/:id", restrictTo("admin"), updateUser);

router.delete("/:id", restrictTo("admin"), deleteUser);

module.exports = router;