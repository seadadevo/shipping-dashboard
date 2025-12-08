/**
 * Authentication Service
 * Contains all business logic for authentication operations
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthenticationError, ValidationError } = require('../utils/errors');
const { USER_TYPES, ERROR_MESSAGES } = require('../constants');

class AuthService {
  /**
   * Generate JWT token
   */
  generateToken(userId, userRole) {
    return jwt.sign(
      { id: userId, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  /**
   * Calculate cookie expiration
   */
  getCookieExpiration() {
    const expiresIn = process.env.JWT_EXPIRES_IN.replace('d', '');
    return new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Validate input
    if (!email || !password) {
      throw new ValidationError(ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED);
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check user type authorization
    const allowedTypes = [
      USER_TYPES.ADMIN,
      USER_TYPES.EMPLOYEE,
      USER_TYPES.MERCHANT,
      USER_TYPES.COURIER,
    ];

    if (!allowedTypes.includes(user.userType)) {
      throw new AuthenticationError(ERROR_MESSAGES.UNAUTHORIZED_USER_TYPE);
    }

    // Generate token
    const token = this.generateToken(user._id, user.userType);

    // Remove password from response
    user.password = undefined;

    return {
      user,
      token,
      cookieExpires: this.getCookieExpiration(),
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AuthenticationError('رمز التوثيق غير صحيح أو منتهي الصلاحية');
    }
  }
}

module.exports = new AuthService();
