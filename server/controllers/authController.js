/**
 * Auth Controller (Refactored - Clean Code)
 * Thin controller that delegates to service layer
 */

const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHandler');
const { SUCCESS_MESSAGES } = require('../constants');

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token, cookieExpires } = await authService.login(email, password);

  // Set cookie
  res.cookie('token', token, {
    expires: cookieExpires,
    httpOnly: true,
  });

  sendSuccess(
    res,
    { user },
    `${SUCCESS_MESSAGES.LOGIN_SUCCESS} - مرحباً ${user.fullName}`,
    200,
    { token }
  );
});
