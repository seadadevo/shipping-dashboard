/**
 * Order Service
 * Contains all business logic for order operations
 */

const Order = require('../models/Order');
const User = require('../models/User');
const WeightSetting = require('../models/WeightSetting');
const Governorate = require('../models/Governotate');
const City = require('../models/City');
const ShippingType = require('../models/ShippingType');
const { paginate } = require('../utils/pagination');
const { NotFoundError, ValidationError, AuthorizationError } = require('../utils/errors');
const { USER_TYPES, ORDER_STATUS, STATE_TRANSITION_RULES, ERROR_MESSAGES } = require('../constants');

class OrderService {
  /**
   * Calculate shipping cost based on weight, location, and shipping type
   */
  async calculateShippingCost(governorate, city, shippingType, totalWeight, isVillageDelivery) {
    const weightSettings = await WeightSetting.findOne();
    if (!weightSettings) {
      throw new NotFoundError(ERROR_MESSAGES.WEIGHT_SETTINGS_NOT_FOUND);
    }

    const govDoc = await Governorate.findOne({ govName: governorate });
    const cityDoc = await City.findOne({ cityName: city, governorate: govDoc?._id });
    
    if (!govDoc || !cityDoc) {
      throw new NotFoundError('اسم المحافظة أو المدينة غير صحيح');
    }

    if (!cityDoc.isActive) {
      throw new ValidationError(ERROR_MESSAGES.CITY_INACTIVE);
    }

    const shippingTypeDoc = await ShippingType.findOne({ name: shippingType });
    if (!shippingTypeDoc) {
      throw new NotFoundError(ERROR_MESSAGES.SHIPPING_TYPE_NOT_FOUND);
    }

    if (!shippingTypeDoc.isActive) {
      throw new ValidationError(ERROR_MESSAGES.SHIPPING_TYPE_INACTIVE);
    }

    const baseCityCostPerKg = cityDoc.shippingCost;
    const { defaultWeightLimit, extraKgCost, villageDeliveryCost } = weightSettings;
    const shippingAdjustment = shippingTypeDoc.adjustmentAmount;

    let weightCost = 0;
    if (totalWeight <= defaultWeightLimit) {
      weightCost = totalWeight * baseCityCostPerKg;
    } else {
      const defaultWeightCost = defaultWeightLimit * baseCityCostPerKg;
      const extraWeight = totalWeight - defaultWeightLimit;
      const extraWeightCost = extraWeight * extraKgCost;
      weightCost = defaultWeightCost + extraWeightCost;
    }

    const villageCost = isVillageDelivery === true ? villageDeliveryCost : 0;
    const calculatedOrderCost = weightCost + shippingAdjustment + villageCost;

    return calculatedOrderCost;
  }

  /**
   * Determine the creator of the order
   */
  async resolveOrderCreator(currentUser, merchantId) {
    let creatorId = currentUser._id;

    if ([USER_TYPES.ADMIN, USER_TYPES.EMPLOYEE].includes(currentUser.userType) && merchantId) {
      const merchantUser = await User.findById(merchantId);
      
      if (!merchantUser) {
        throw new NotFoundError(ERROR_MESSAGES.MERCHANT_NOT_FOUND);
      }

      if (merchantUser.userType !== USER_TYPES.MERCHANT) {
        throw new ValidationError(ERROR_MESSAGES.INVALID_MERCHANT);
      }

      creatorId = merchantId;
    }

    return creatorId;
  }

  /**
   * Create a new order
   */
  async createOrder(orderData, currentUser) {
    const creatorId = await this.resolveOrderCreator(currentUser, orderData.merchantId);

    const {
      orderType,
      customerName,
      customerPhone1,
      governorate,
      city,
      street,
      shippingType,
      paymentType,
      totalWeight,
      isVillageDelivery,
    } = orderData;

    // Validate required fields
    const requiredFields = {
      orderType,
      customerName,
      customerPhone1,
      governorate,
      city,
      street,
      shippingType,
      paymentType,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        throw new ValidationError(`حقل مطلوب مفقود: ${key}`);
      }
    }

    if (totalWeight === null || totalWeight === undefined) {
      throw new ValidationError('حقل مطلوب مفقود: totalWeight');
    }

    // Calculate cost
    const calculatedOrderCost = await this.calculateShippingCost(
      governorate,
      city,
      shippingType,
      totalWeight,
      isVillageDelivery
    );

    // Create order
    const newOrder = new Order({
      ...orderData,
      orderCost: calculatedOrderCost,
      createdBy: creatorId,
      assignedDriver: orderData.assignedDriver || null,
    });

    await newOrder.save();

    return {
      order: newOrder,
      calculatedCost: calculatedOrderCost,
    };
  }

  /**
   * Get all orders with filters and pagination
   */
  async getAllOrders(filters, paginationOptions, populate = null) {
    const query = {};

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.q) {
      const searchRegex = new RegExp(filters.q, 'i');
      query.$or = [
        { customerName: searchRegex },
        { customerPhone1: searchRegex },
        { customerEmail: searchRegex },
      ];
    }

    const options = {
      ...paginationOptions,
      sort: { createdAt: -1 },
    };

    if (populate) {
      options.populate = populate;
    }

    const { data: orders, meta } = await paginate(Order, query, options);

    return { orders, meta };
  }

  /**
   * Get orders for specific merchant
   */
  async getMyOrders(userId, filters, paginationOptions) {
    const query = { createdBy: userId };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.q) {
      const searchRegex = new RegExp(filters.q, 'i');
      query.$or = [
        { customerName: searchRegex },
        { customerPhone1: searchRegex },
      ];
    }

    const { data: orders, meta } = await paginate(Order, query, {
      ...paginationOptions,
      populate: { path: 'createdBy', select: 'fullName userType' },
      sort: { createdAt: -1 },
    });

    return { orders, meta };
  }

  /**
   * Validate state transition
   */
  validateStateChange(userRole, currentState, newState) {
    const allowedTransitions = STATE_TRANSITION_RULES[userRole]?.[currentState] || [];

    if (!allowedTransitions.includes(newState)) {
      let errorMessage = 'Unauthorized state transition.';

      switch (userRole) {
        case USER_TYPES.EMPLOYEE:
          if (currentState === ORDER_STATUS.PENDING) {
            errorMessage = 'الموظف يمكنه فقط نقل الطلبات من قيد الانتظار إلى قيد المعالجة أو إلغائها';
          } else if (currentState === ORDER_STATUS.PROCESSING) {
            errorMessage = 'الموظف يمكنه إرجاع الطلب إلى قيد الانتظار أو إلغائه فقط';
          } else if (currentState === ORDER_STATUS.DELIVERED) {
            errorMessage = 'الموظف لا يمكنه تعديل الطلبات المسلمة. اتصل بالمدير للتغييرات';
          } else if (currentState === ORDER_STATUS.ON_THE_WAY) {
            errorMessage = 'الموظف لا يمكنه تعديل الطلبات التي في الطريق';
          } else {
            errorMessage = 'الموظف لا يمكنه التراجع عن الطلبات الملغاة';
          }
          break;

        case USER_TYPES.MERCHANT:
          errorMessage = 'التاجر لديه صلاحيات القراءة فقط. لا يمكنه تعديل حالة الطلب.';
          break;

        case USER_TYPES.COURIER:
          if (currentState === ORDER_STATUS.DELIVERED) {
            errorMessage = 'المندوب لا يمكنه التراجع عن الطلبات المسلمة. اتصل بالمدير في حالة وجود مشكلة.';
          } else if (currentState === ORDER_STATUS.CANCELLED) {
            errorMessage = 'لا يمكن العمل على الطلبات الملغاة.';
          } else if (currentState === ORDER_STATUS.PENDING) {
            errorMessage = 'المندوب يمكنه العمل فقط على الطلبات قيد المعالجة.';
          } else {
            errorMessage = 'المندوب يمكنه فقط نقل الطلبات من قيد المعالجة → في الطريق → تم التسليم.';
          }
          break;
      }

      throw new AuthorizationError(errorMessage);
    }

    return true;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, newStatus, userId, userRole, changeReason) {
    const currentOrder = await Order.findById(orderId);
    
    if (!currentOrder) {
      throw new NotFoundError(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    const currentState = currentOrder.status;

    // Validate state transition
    this.validateStateChange(userRole, currentState, newStatus);

    // Add to state history
    const stateHistoryEntry = {
      previousState: currentState,
      newState: newStatus,
      changedBy: userId,
      changeReason: changeReason || `State changed by ${userRole}`,
      changedAt: new Date(),
    };

    // Prepare update data
    const updateData = {
      status: newStatus,
      $push: { stateHistory: stateHistoryEntry },
    };

    // If reverting to Pending, remove assigned driver
    if (newStatus === ORDER_STATUS.PENDING && currentState === ORDER_STATUS.PROCESSING) {
      updateData.assignedDriver = null;
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
      runValidators: true,
    }).populate('stateHistory.changedBy', 'fullName userType email');

    return {
      order: updatedOrder,
      stateHistory: `${currentState} → ${newStatus}`,
    };
  }

  /**
   * Delete order
   */
  async deleteOrder(orderId) {
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    
    if (!deletedOrder) {
      throw new NotFoundError(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return deletedOrder;
  }
}

module.exports = new OrderService();
