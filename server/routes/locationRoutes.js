const express = require("express");
const router = express.Router();
const {
  addGovernorate,
  getAllGovernorates,
  addCity,
  getAllCities,
  getCitiesByGovernorate
} = require("../controllers/locationController");

const { protect, restrictTo } = require("../middleware/authMiddleware");

// --- Governorate Routes ---
// Only admins can add new governorates
router.post("/governorates", protect, restrictTo("admin"), addGovernorate);
// All authenticated users can view governorates
router.get("/governorates", protect, getAllGovernorates);

// --- City Routes ---
// Only admins can add new cities
router.post("/cities", protect, restrictTo("admin"), addCity);
// All authenticated users can view cities
router.get("/cities", protect, getAllCities);
// Get cities for a specific governorate
router.get("/governorates/:govId/cities", protect, getCitiesByGovernorate);


module.exports = router;
