const express = require("express");
const router = express.Router();
const {
	addUser,
	getUsers,
	updateUser,
	deleteUser,
	getUsersWithSearch,
} = require("../controllers/userController");

// Get all users
router.get("/", getUsers);

// Get users with search
router.get("/search", getUsersWithSearch);

// Add new user
router.post("/add", addUser);

// Update user by ID
router.put("/:id", updateUser);

// Delete user by ID
router.delete("/:id", deleteUser);

module.exports = router;
