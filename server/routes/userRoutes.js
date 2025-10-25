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

router.get("/", getUsers);

router.get("/search", getUsersWithSearch);


router.use(restrictTo("admin"));

router.post("/add", addUser);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

module.exports = router;