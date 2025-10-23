const express = require("express");
const router = express.Router();
const {
  addUser,
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

// Add new user
router.post("/add", addUser);

// Get all users
router.get("/", getUsers);

// Update user by ID
router.put("/:id", updateUser);

// Delete user by ID
router.delete("/:id", deleteUser);

module.exports = router;
