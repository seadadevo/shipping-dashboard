/**
 * Location Controller (Refactored - Clean Code)
 * Thin controller that delegates to service layer
 */

const locationService = require('../services/locationService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated, sendPaginatedResponse } = require('../utils/responseHandler');
const { SUCCESS_MESSAGES } = require('../constants');

// ============= Governorate Controllers =============

/**
 * @route   POST /api/locations/governorates
 * @desc    Add new governorate
 * @access  Private (Admin)
 */
exports.addGovernorate = asyncHandler(async (req, res) => {
  const { govName, govCode } = req.body;
  
  const newGovernorate = await locationService.addGovernorate(govName, govCode);
  
  sendCreated(res, newGovernorate, SUCCESS_MESSAGES.GOVERNORATE_ADDED);
});

/**
 * @route   GET /api/locations/governorates
 * @desc    Get all governorates
 * @access  Private
 */
exports.getAllGovernorates = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  
  const { governorates, meta } = await locationService.getAllGovernorates({ page, limit });
  
  sendPaginatedResponse(res, governorates, meta);
});

/**
 * @route   PUT /api/locations/governorates/:id
 * @desc    Update governorate
 * @access  Private (Admin)
 */
exports.updateGovernorate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { govName, govCode } = req.body;
  
  const updatedGovernorate = await locationService.updateGovernorate(id, govName, govCode);
  
  sendSuccess(res, updatedGovernorate, SUCCESS_MESSAGES.GOVERNORATE_UPDATED);
});

/**
 * @route   PATCH /api/locations/governorates/:id/toggle-status
 * @desc    Toggle governorate status
 * @access  Private (Admin)
 */
exports.toggleGovernorateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const governorate = await locationService.toggleGovernorateStatus(id);
  
  const message = `تم ${governorate.isActive ? 'تفعيل' : 'إلغاء تفعيل'} المحافظة بنجاح`;
  sendSuccess(res, governorate, message);
});

/**
 * @route   DELETE /api/locations/governorates/:id
 * @desc    Delete governorate
 * @access  Private (Admin)
 */
exports.deleteGovernorate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await locationService.deleteGovernorate(id);
  
  sendSuccess(res, null, SUCCESS_MESSAGES.GOVERNORATE_DELETED);
});

// ============= City Controllers =============

/**
 * @route   POST /api/locations/cities
 * @desc    Add new city
 * @access  Private (Admin)
 */
exports.addCity = asyncHandler(async (req, res) => {
  const { cityName, governorateId, shippingCost } = req.body;
  
  const newCity = await locationService.addCity(cityName, governorateId, shippingCost);
  
  sendCreated(res, newCity, SUCCESS_MESSAGES.CITY_ADDED);
});

/**
 * @route   GET /api/locations/cities
 * @desc    Get all cities
 * @access  Private
 */
exports.getAllCities = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  
  const { cities, meta } = await locationService.getAllCities({ page, limit });
  
  sendPaginatedResponse(res, cities, meta);
});

/**
 * @route   PUT /api/locations/cities/:id
 * @desc    Update city
 * @access  Private (Admin)
 */
exports.updateCity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cityName, governorateId, shippingCost } = req.body;
  
  const updatedCity = await locationService.updateCity(id, cityName, governorateId, shippingCost);
  
  sendSuccess(res, updatedCity, SUCCESS_MESSAGES.CITY_UPDATED);
});

/**
 * @route   PATCH /api/locations/cities/:id/toggle-status
 * @desc    Toggle city status
 * @access  Private (Admin)
 */
exports.toggleCityStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const city = await locationService.toggleCityStatus(id);
  
  const message = `تم ${city.isActive ? 'تفعيل' : 'إلغاء تفعيل'} المدينة بنجاح`;
  sendSuccess(res, city, message);
});

/**
 * @route   DELETE /api/locations/cities/:id
 * @desc    Delete city
 * @access  Private (Admin)
 */
exports.deleteCity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await locationService.deleteCity(id);
  
  sendSuccess(res, null, SUCCESS_MESSAGES.CITY_DELETED);
});

/**
 * @route   GET /api/locations/governorates/:govId/cities
 * @desc    Get cities by governorate
 * @access  Private
 */
exports.getCitiesByGovernorate = asyncHandler(async (req, res) => {
  const { govId } = req.params;
  const { page, limit } = req.query;
  
  const { cities, meta } = await locationService.getCitiesByGovernorate(govId, { page, limit });
  
  sendPaginatedResponse(res, cities, meta);
});
