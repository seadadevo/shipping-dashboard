const express = require('express');
const router = express.Router();
const {
	getAllDrivers,
	assignCitiesToDriver,
	getDriversByCity,
	getDriverDeliveries,
	updateDriverStatus,
	getDriverStats,
	updateDriverAvailability
} = require('../controllers/driverController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Admin routes
router.get('/all', protect, restrictTo('admin'), getAllDrivers);
router.post('/:id/assign-cities', protect, restrictTo('admin'), assignCitiesToDriver);
router.patch('/:id/availability', protect, restrictTo('admin'), updateDriverAvailability);
router.get('/by-city', protect, getDriversByCity);

// Driver routes
router.get('/deliveries', protect, restrictTo('courier'), getDriverDeliveries);
router.get('/my-orders', protect, restrictTo('courier'), getDriverDeliveries); // Same endpoint for my-orders
router.patch('/deliveries/:id/status', protect, restrictTo('courier'), updateDriverStatus);
router.get('/stats', protect, restrictTo('courier'), getDriverStats);

module.exports = router;
