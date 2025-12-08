/**
 * Shipping Type Controller (Refactored - Clean Code)
 * Thin controller that delegates to service layer
 */

const shippingTypeService = require('../services/shippingTypeService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated, sendPaginatedResponse } = require('../utils/responseHandler');

/**
 * @route   POST /api/shipping-types
 * @desc    Add new shipping type
 * @access  Private (Admin)
 */
exports.addShippingType = asyncHandler(async (req, res) => {
  const { name, adjustmentAmount, description } = req.body;
  
  const newType = await shippingTypeService.createShippingType(name, adjustmentAmount, description);
  
  sendCreated(res, newType, 'تم إضافة نوع الشحن بنجاح');
});

/**
 * @route   GET /api/shipping-types
 * @desc    Get all shipping types
 * @access  Private
 */
exports.getAllShippingTypes = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  
  const { types, meta } = await shippingTypeService.getAllShippingTypes({ page, limit });
  
  sendPaginatedResponse(res, types, meta);
});

/**
 * @route   PUT /api/shipping-types/:id
 * @desc    Update shipping type
 * @access  Private (Admin)
 */
exports.updateShippingType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, adjustmentAmount, description } = req.body;
  
  const updatedType = await shippingTypeService.updateShippingType(id, name, adjustmentAmount, description);
  
  sendSuccess(res, updatedType, 'تم تحديث نوع الشحن بنجاح');
});

/**
 * @route   PATCH /api/shipping-types/:id/toggle-status
 * @desc    Toggle shipping type status
 * @access  Private (Admin)
 */
exports.toggleShippingTypeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const type = await shippingTypeService.toggleShippingTypeStatus(id);
  
  const message = `تم ${type.isActive ? 'تفعيل' : 'إلغاء تفعيل'} نوع الشحن`;
  sendSuccess(res, type, message);
});

/**
 * @route   DELETE /api/shipping-types/:id
 * @desc    Delete shipping type
 * @access  Private (Admin)
 */
exports.deleteShippingType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await shippingTypeService.deleteShippingType(id);
  
  sendSuccess(res, null, 'تم حذف نوع الشحن بنجاح');
});
