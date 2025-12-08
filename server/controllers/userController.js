/**
 * User Controller (Refactored - Clean Code)
 * Thin controller that delegates to service layer
 */

const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated, sendPaginatedResponse } = require('../utils/responseHandler');
const { SUCCESS_MESSAGES } = require('../constants');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.user.id);
  sendSuccess(res, user);
});

/**
 * @route   PUT /api/users/password
 * @desc    Update user password
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  await userService.updatePassword(req.user.id, currentPassword, newPassword);
  
  sendSuccess(res, null, SUCCESS_MESSAGES.PASSWORD_UPDATED);
});

/**
 * @route   POST /api/users
 * @desc    Add new user
 * @access  Private (Admin)
 */
exports.addUser = asyncHandler(async (req, res) => {
  const newUser = await userService.createUser(req.body);
  sendCreated(res, newUser, SUCCESS_MESSAGES.USER_ADDED);
});

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
exports.getUsers = asyncHandler(async (req, res) => {
  const { userType, page, limit } = req.query;
  
  const { users, meta } = await userService.getAllUsers(
    { userType },
    { page, limit }
  );

  sendPaginatedResponse(res, users, meta);
});

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private (Admin)
 */
exports.getUsersWithSearch = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  
  const { users, meta } = await userService.searchUsers(q, { page, limit });

  sendPaginatedResponse(res, users, meta);
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedUser = await userService.updateUser(id, req.body);
  sendSuccess(res, updatedUser, SUCCESS_MESSAGES.USER_UPDATED);
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await userService.deleteUser(id);
  sendSuccess(res, null, SUCCESS_MESSAGES.USER_DELETED);
});

/**
 * @route   GET /api/users/search-merchants
 * @desc    Search merchants
 * @access  Private
 */
exports.searchMerchants = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  
  const { merchants, meta } = await userService.searchMerchants(q, { page, limit });

  sendPaginatedResponse(res, merchants, meta);
});
