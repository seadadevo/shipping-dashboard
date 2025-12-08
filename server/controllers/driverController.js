/**
 * Driver Controller (Refactored - Clean Code)
 * Thin controller that delegates to service layer
 */

const driverService = require('../services/driverService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHandler');
const { SUCCESS_MESSAGES } = require('../constants');

/**
 * @route   GET /api/drivers
 * @desc    Get all drivers
 * @access  Private (Admin, Employee)
 */
exports.getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await driverService.getAllDrivers();
  sendSuccess(res, drivers, null, 200, { count: drivers.length });
});

/**
 * @route   PUT /api/drivers/:id/assign-cities
 * @desc    Assign cities to a driver
 * @access  Private (Admin)
 */
exports.assignCitiesToDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cities } = req.body;

  const driver = await driverService.assignCitiesToDriver(id, cities);
  
  sendSuccess(res, driver, SUCCESS_MESSAGES.CITIES_ASSIGNED);
});

/**
 * @route   GET /api/drivers/by-city
 * @desc    Get drivers by city
 * @access  Private
 */
exports.getDriversByCity = asyncHandler(async (req, res) => {
  const { governorate, city } = req.query;

  const drivers = await driverService.getDriversByCity(governorate, city);
  
  sendSuccess(res, drivers, null, 200, { count: drivers.length });
});

/**
 * @route   GET /api/drivers/deliveries
 * @desc    Get driver's deliveries
 * @access  Private (Courier)
 */
exports.getDriverDeliveries = asyncHandler(async (req, res) => {
  const driverId = req.user.id;
  const { status, page, limit, q } = req.query;

  const { orders, meta } = await driverService.getDriverDeliveries(
    driverId,
    { status, q },
    { page, limit }
  );

  sendSuccess(res, orders, null, 200, meta);
});

/**
 * @route   PUT /api/drivers/orders/:id/status
 * @desc    Update driver status for an order
 * @access  Private (Courier)
 */
exports.updateDriverStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { driverStatus } = req.body;
  const driverId = req.user.id;

  const order = await driverService.updateDriverStatus(id, driverId, driverStatus);
  
  sendSuccess(res, order, SUCCESS_MESSAGES.STATUS_UPDATED);
});

/**
 * @route   PUT /api/drivers/:id/availability
 * @desc    Toggle driver availability
 * @access  Private (Admin)
 */
exports.updateDriverAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isAvailable } = req.body;

  const driver = await driverService.updateDriverAvailability(id, isAvailable);
  
  const message = `تم ${isAvailable ? 'تفعيل' : 'إلغاء تفعيل'} توفر السائق`;
  sendSuccess(res, driver, message);
});

/**
 * @route   GET /api/drivers/stats
 * @desc    Get driver statistics
 * @access  Private (Courier)
 */
exports.getDriverStats = asyncHandler(async (req, res) => {
  const driverId = req.user.id;
  
  const stats = await driverService.getDriverStats(driverId);
  
  sendSuccess(res, stats);
});
