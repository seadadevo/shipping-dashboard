/**
 * Order Controller (Refactored - Clean Code)
 * Thin controller that delegates to service layer
 */

const orderService = require('../services/orderService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated, sendPaginatedResponse } = require('../utils/responseHandler');
const { SUCCESS_MESSAGES } = require('../constants');

/**
 * @route   POST /api/orders/calculate-cost
 * @desc    Calculate shipping cost before order creation
 * @access  Private
 */
exports.calculateCost = asyncHandler(async (req, res) => {
  const { governorate, city, shippingType, totalWeight, isVillageDelivery } = req.body;

  const calculatedCost = await orderService.calculateShippingCost(
    governorate,
    city,
    shippingType,
    totalWeight,
    isVillageDelivery
  );

  sendSuccess(res, {
    calculatedCost,
    breakdown: {
      governorate,
      city,
      shippingType,
      totalWeight,
      isVillageDelivery: isVillageDelivery || false,
    },
  });
});

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private (Admin, Employee, Merchant)
 */
exports.addOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.body, req.user);
  sendCreated(res, result, SUCCESS_MESSAGES.ORDER_CREATED);
});

/**
 * @route   GET /api/orders
 * @desc    Get all orders with filters
 * @access  Private (Admin, Employee)
 */
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { status, q, page, limit } = req.query;
  
  const { orders, meta } = await orderService.getAllOrders(
    { status, q },
    { page, limit },
    { path: 'createdBy', select: 'fullName userType email phone storeName' }
  );

  sendPaginatedResponse(res, { orders }, meta);
});

/**
 * @route   GET /api/orders/search
 * @desc    Search orders
 * @access  Private
 */
exports.searchOrders = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  
  const { orders, meta } = await orderService.getAllOrders(
    { q },
    { page, limit },
    { path: 'createdBy', select: 'fullName userType email phone storeName' }
  );

  sendPaginatedResponse(res, { orders }, meta);
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Role-based)
 */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, changeReason } = req.body;

  const result = await orderService.updateOrderStatus(
    id,
    status,
    req.user._id,
    req.user.userType,
    changeReason
  );

  sendSuccess(res, result, SUCCESS_MESSAGES.STATUS_UPDATED);
});

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete order
 * @access  Private (Admin)
 */
exports.deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await orderService.deleteOrder(id);
  sendSuccess(res, null, SUCCESS_MESSAGES.ORDER_DELETED);
});

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get merchant's own orders
 * @access  Private (Merchant)
 */
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { status, q, page, limit } = req.query;
  
  const { orders, meta } = await orderService.getMyOrders(
    req.user._id,
    { status, q },
    { page, limit }
  );

  sendPaginatedResponse(res, { orders }, meta);
});
