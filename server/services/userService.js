/**
 * User Service
 * Contains all business logic for user operations
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { paginate } = require('../utils/pagination');
const { NotFoundError, ValidationError, AuthenticationError } = require('../utils/errors');
const { USER_TYPES, ERROR_MESSAGES } = require('../constants');

class UserService {
  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Update password
   */
  async updatePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user || !user.password) {
      throw new NotFoundError('لم يتم العثور على ملف المستخدم أو حقل كلمة المرور مفقود.');
    }

    if (!currentPassword) {
      throw new ValidationError('لا يمكن أن يكون حقل كلمة المرور الحالية فارغًا.');
    }

    if (!newPassword) {
      throw new ValidationError('لا يمكن أن يكون حقل كلمة المرور الجديدة فارغًا.');
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      throw new AuthenticationError('كلمة المرور الحالية غير صحيحة');
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true, runValidators: false }
    );

    return true;
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const allowedFields = [
      'userType',
      'fullName',
      'email',
      'password',
      'phone',
      'address',
      'governorate',
      'city',
      'storeName',
      'assignedCities',
      'pickupCost',
      'rejectionFeePercentage',
    ];

    const filteredData = Object.fromEntries(
      allowedFields.map((key) => [key, userData[key]])
    );

    // Check for existing user
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ValidationError('البريد الإلكتروني مستخدم بالفعل');
    }

    const newUser = new User(filteredData);
    await newUser.save();

    // Remove password from response
    newUser.password = undefined;

    return newUser;
  }

  /**
   * Get all users with filters and pagination
   */
  async getAllUsers(filters, paginationOptions) {
    const query = {};

    if (filters.userType && filters.userType !== 'all') {
      query.userType = filters.userType;
    }

    const { data: users, meta } = await paginate(User, query, {
      ...paginationOptions,
      select: '-password',
      sort: { createdAt: -1 },
    });

    return { users, meta };
  }

  /**
   * Search users
   */
  async searchUsers(searchQuery, paginationOptions) {
    if (!searchQuery) {
      throw new ValidationError('مصطلح البحث مطلوب');
    }

    const searchRegex = new RegExp(searchQuery, 'i');
    const query = {
      $or: [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ],
    };

    const { data: users, meta } = await paginate(User, query, {
      ...paginationOptions,
      select: '-password',
      sort: { createdAt: -1 },
    });

    return { users, meta };
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData) {
    const allowedFields = [
      'userType',
      'fullName',
      'email',
      'phone',
      'address',
      'governorate',
      'city',
      'storeName',
      'assignedCities',
      'pickupCost',
      'rejectionFeePercentage',
    ];

    const filteredData = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }

    // Handle password separately
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      filteredData.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, filteredData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return updatedUser;
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return deletedUser;
  }

  /**
   * Search merchants
   */
  async searchMerchants(searchQuery, paginationOptions) {
    const query = { userType: USER_TYPES.MERCHANT };

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { storeName: searchRegex },
      ];
    }

    const { data: merchants, meta } = await paginate(User, query, {
      ...paginationOptions,
      select: 'fullName email storeName phone',
      sort: { fullName: 1 },
    });

    return { merchants, meta };
  }
}

module.exports = new UserService();
