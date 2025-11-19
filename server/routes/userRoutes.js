const express = require("express");
const router = express.Router();
const {
  addUser,
  getUsers,
  updateUser,
  deleteUser,
  getUsersWithSearch,
  searchMerchants,
  getUserProfile, 
  updatePassword
} = require("../controllers/userController");

const { protect, restrictTo } = require("../middleware/authMiddleware");
router.use(protect); 

router.route('/password').put(protect, updatePassword);
router.route('/profile').get(protect, getUserProfile); 

router.get("/merchants/search", restrictTo("admin", "employee"), searchMerchants);
router.get("/search", getUsersWithSearch);

router.use(restrictTo("admin"));
router.get("/", getUsers);

router.post("/add", addUser);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);


module.exports = router;