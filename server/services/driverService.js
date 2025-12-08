/**
 * Driver Service
 * Contains all business logic for driver/courier operations
 */

const User = require('../models/User');
const Order = require('../models/Order');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { USER_TYPES, ERROR_MESSAGES } = require('../constants');

class DriverService {
  /**
   * Get all drivers
   */
  async getAllDrivers() {
    const drivers = await User.find({ userType: USER_TYPES.COURIER })
      .select('fullName phoneNumber email assignedCities isAvailable')
      .sort({ fullName: 1 });

    return drivers;
  }

  /**
   * Assign cities to a driver
   */
  async assignCitiesToDriver(driverId, cities) {
    const driver = await User.findById(driverId);
    
    if (!driver) {
      throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }

    if (driver.userType !== USER_TYPES.COURIER) {
      throw new ValidationError(ERROR_MESSAGES.USER_NOT_COURIER);
    }

    driver.assignedCities = cities;
    await driver.save();

    return driver;
  }

  /**
   * Get drivers by city
   */
  async getDriversByCity(governorate, city) {
    if (!governorate || !city) {
      throw new ValidationError('المحافظة والمدينة مطلوبان');
    }

    const drivers = await User.find({
      userType: USER_TYPES.COURIER,
      isAvailable: true,
      assignedCities: {
        $elemMatch: {
          governorate: governorate,
          city: city,
        },
      },
    }).select('fullName phoneNumber assignedCities');

    return drivers;
  }

  /**
   * Get driver deliveries
   */
  async getDriverDeliveries(driverId, filters, paginationOptions) {
    const query = { assignedDriver: driverId };

    // Handle status filter
    if (filters.status && filters.status !== 'all') {
      const statusArray = filters.status.split(',');
      query.status = statusArray.length > 1 ? { $in: statusArray } : filters.status;
    }

    // Handle search
    if (filters.q && filters.q.trim()) {
      const searchRegex = new RegExp(filters.q.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { customerPhone1: searchRegex },
        { customerPhone2: searchRegex },
        { customerEmail: searchRegex },
      ];
    }

    // Pagination
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('createdBy', 'fullName storeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return {
      orders,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update driver status for an order
   */
  async updateDriverStatus(orderId, driverId, driverStatus) {
    const order = await Order.findOne({ _id: orderId, assignedDriver: driverId });
    
    if (!order) {
      throw new NotFoundError('الطلب غير موجود أو غير مخصص لك');
    }

    order.driverStatus = driverStatus;

    // Update main status based on driver status
    if (driverStatus === 'delivered') {
      order.status = 'Delivered';
    } else if (driverStatus === 'in-transit') {
      order.status = 'Shipped';
    }

    await order.save();

    return order;
  }

  /**
   * Toggle driver availability
   */
  async updateDriverAvailability(driverId, isAvailable) {
    const driver = await User.findById(driverId);
    
    if (!driver) {
      throw new NotFoundError(ERROR_MESSAGES.DRIVER_NOT_FOUND);
    }

    if (driver.userType !== USER_TYPES.COURIER) {
      throw new ValidationError(ERROR_MESSAGES.USER_NOT_COURIER);
    }

    driver.isAvailable = isAvailable;
    await driver.save();

    return driver;
  }

  /**
   * Get driver statistics
   */
  async getDriverStats(driverId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const [todayDeliveries, weekDeliveries, totalDelivered, pendingDeliveries] = await Promise.all([
      Order.countDocuments({
        assignedDriver: driverId,
        driverStatus: 'delivered',
        updatedAt: { $gte: today },
      }),
      Order.countDocuments({
        assignedDriver: driverId,
        driverStatus: 'delivered',
        updatedAt: { $gte: weekAgo },
      }),
      Order.countDocuments({
        assignedDriver: driverId,
        driverStatus: 'delivered',
      }),
      Order.countDocuments({
        assignedDriver: driverId,
        driverStatus: { $in: ['pending', 'picked-up', 'in-transit'] },
      }),
    ]);

    return {
      todayDeliveries,
      weekDeliveries,
      totalDelivered,
      pendingDeliveries,
    };
  }
}

module.exports = new DriverService();
