const express = require("express");
const router = express.Router();
const {
  addGovernorate,
  getAllGovernorates,
  updateGovernorate, // ADDED
  toggleGovernorateStatus, // ADDED
  deleteGovernorate, // ADDED
  addCity,
  getAllCities,
  updateCity, // ADDED
  toggleCityStatus, // ADDED
  deleteCity, // ADDED
  getCitiesByGovernorate
} = require("../controllers/locationController");

const { protect, restrictTo } = require("../middleware/authMiddleware");

// --- Governorate Routes ---
router.post("/governorates", protect, restrictTo("admin"), addGovernorate);
router.get("/governorates", protect, getAllGovernorates);
// --- ADDED ---
router.put("/governorates/:id", protect, restrictTo("admin"), updateGovernorate);
router.patch("/governorates/:id/toggle-status", protect, restrictTo("admin"), toggleGovernorateStatus);
router.delete("/governorates/:id", protect, restrictTo("admin"), deleteGovernorate);
// --- END ADDED ---


// --- City Routes ---
router.post("/cities", protect, restrictTo("admin"), addCity);
router.get("/cities", protect, getAllCities);
router.get("/governorates/:govId/cities", protect, getCitiesByGovernorate);
// --- ADDED ---
router.put("/cities/:id", protect, restrictTo("admin"), updateCity);
router.patch("/cities/:id/toggle-status", protect, restrictTo("admin"), toggleCityStatus);
router.delete("/cities/:id", protect, restrictTo("admin"), deleteCity);
// --- END ADDED ---


module.exports = router;