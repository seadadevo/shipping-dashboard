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

router.get("/", restrictTo("admin", "employee"),  getUsers);

router.get("/search", restrictTo("admin"), getUsersWithSearch);

router.post("/add", restrictTo("admin"), addUser);

router.route('/password').put(protect, updatePassword);
router.route('/profile').get(protect, getUserProfile); 

router.get("/merchants/search", restrictTo("admin", "employee"), searchMerchants);
router.get("/search", getUsersWithSearch);

router.use(restrictTo("admin"));
router.get("/", getUsers);

router.post("/add", addUser);

router.put("/:id", restrictTo("admin"), updateUser);

router.delete("/:id", restrictTo("admin"), deleteUser);


module.exports = router;