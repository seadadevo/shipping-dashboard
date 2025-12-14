const express = require("express");
const router = express.Router();
const {
  addGovernorate,
  getAllGovernorates,
  updateGovernorate, 
  toggleGovernorateStatus, 
  deleteGovernorate, 
  addCity,
  getAllCities,
  updateCity, 
  toggleCityStatus, 
  deleteCity, 
  getCitiesByGovernorate
} = require("../controllers/locationController");

const { protect, restrictTo } = require("../middleware/authMiddleware");


router.post("/governorates", protect, restrictTo("admin"), addGovernorate);
router.get("/governorates", protect, getAllGovernorates);

router.put("/governorates/:id", protect, restrictTo("admin"), updateGovernorate);
router.patch("/governorates/:id/toggle-status", protect, restrictTo("admin"), toggleGovernorateStatus);
router.delete("/governorates/:id", protect, restrictTo("admin"), deleteGovernorate);




router.post("/cities", protect, restrictTo("admin"), addCity);
router.get("/cities", protect, getAllCities);
router.get("/governorates/:govId/cities", protect, getCitiesByGovernorate);

router.put("/cities/:id", protect, restrictTo("admin"), updateCity);
router.patch("/cities/:id/toggle-status", protect, restrictTo("admin"), toggleCityStatus);
router.delete("/cities/:id", protect, restrictTo("admin"), deleteCity);



module.exports = router;