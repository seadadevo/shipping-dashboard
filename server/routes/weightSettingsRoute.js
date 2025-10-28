// routes/weightSettingsRoute.js
const express = require('express');
const router = express.Router();
const { getWeightSettings, updateWeightSettings } = require('../controllers/weightSettingsController');

// تحديد المسارات (Endpoints)
router.route('/weight-settings')
    .get(getWeightSettings)    // GET لـ /api/weight-settings
    .put(updateWeightSettings); // PUT لـ /api/weight-settings

module.exports = router;