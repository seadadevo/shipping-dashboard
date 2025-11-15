const express = require('express');
const router = express.Router();
const { getWeightSettings, updateWeightSettings } = require('../controllers/weightSettingsController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); 


router.route('/')
    .get(protect, getWeightSettings) 
    .put(protect, restrictTo('admin'), updateWeightSettings); 

module.exports = router;