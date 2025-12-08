const Order = require("../models/Order");
const User = require("../models/User"); // 👈 ده السطر اللي كان ناقص ومسبب المشكلة
const { paginate } = require("../utils/pagination");

// --- باقي الموديلات ---
const WeightSetting = require("../models/WeightSetting");
const Governorate = require("../models/Governotate");
const City = require("../models/City");
const ShippingType = require("../models/ShippingType");

// دالة مشتركة لحساب التكلفة
const calculateShippingCost = async (
  governorate,
  city,
  shippingType,
  totalWeight,
  isVillageDelivery
) => {
  const weightSettings = await WeightSetting.findOne();
  const govDoc = await Governorate.findOne({ govName: governorate });
  const cityDoc = await City.findOne({
    cityName: city,
    governorate: govDoc?._id,
  });
  const shippingTypeDoc = await ShippingType.findOne({ name: shippingType });

  if (!weightSettings) throw new Error("إعدادات الوزن غير مضبوطة");
  if (!govDoc || !cityDoc) throw new Error("اسم المحافظة أو المدينة غير صحيح");
  if (!cityDoc.isActive) throw new Error("المدينة المحددة غير مفعلة");
  if (!shippingTypeDoc) throw new Error("نوع الشحن غير صحيح");
  if (!shippingTypeDoc.isActive) throw new Error("نوع الشحن المحدد غير مفعل");

  const baseCityPrice = cityDoc.shippingCost; // سعر المدينة (ثابت)
  const { defaultWeightLimit, extraKgCost, villageDeliveryCost } =
    weightSettings;
  const shippingAdjustment = shippingTypeDoc.adjustmentAmount;

  // اللوجيك الجديد:
  // 1. سعر المدينة (ثابت للـ default weight)
  let weightCost = baseCityPrice;

  // 2. إذا كان الوزن أكبر من الـ default، نضيف تكلفة الكيلوات الزيادة
  if (totalWeight > defaultWeightLimit) {
    const extraWeight = totalWeight - defaultWeightLimit;
    const extraWeightCost = extraWeight * extraKgCost;
    weightCost += extraWeightCost;
  }

  // 3. رسوم القرية (إن وجدت)
  const villageCost = isVillageDelivery === true ? villageDeliveryCost : 0;

  // 4. التكلفة النهائية = سعر المدينة + الوزن الزيادة + نوع الشحن + القرية
  const calculatedOrderCost = weightCost + shippingAdjustment + villageCost;

  return calculatedOrderCost;
};

// Endpoint لحساب التكلفة قبل إنشاء الطلب
exports.calculateCost = async (req, res) => {
  try {
    const { governorate, city, shippingType, totalWeight, isVillageDelivery } =
      req.body;

    if (!governorate || !city || !shippingType || !totalWeight) {
      return res.status(400).json({
        message:
          "جميع الحقول مطلوبة: governorate, city, shippingType, totalWeight",
      });
    }

    const calculatedCost = await calculateShippingCost(
      governorate,
      city,
      shippingType,
      totalWeight,
      isVillageDelivery
    );

    res.status(200).json({
      status: "success",
      data: {
        calculatedCost,
        breakdown: {
          governorate,
          city,
          shippingType,
          totalWeight,
          isVillageDelivery: isVillageDelivery || false,
        },
      },
    });
  } catch (error) {
    console.error("Calculate cost error:", error);
    res.status(500).json({
      message: error.message || "خطأ في حساب التكلفة",
      error: error.message,
    });
  }
};

exports.addOrder = async (req, res) => {
  try {
    const orderData = req.body;

    // 1. تحديد صاحب الطلب (creatorId)
    let creatorId = req.user._id; // الافتراضي: المستخدم الحالي

    // لو المستخدم (أدمن أو موظف) وباعِت merchantId، نستخدمه
    if (
      ["admin", "employee"].includes(req.user.userType) &&
      orderData.merchantId
    ) {
      const merchantUser = await User.findById(orderData.merchantId); // 👈 هنا كان بيحصل الخطأ
      if (!merchantUser) {
        return res.status(404).json({ message: "التاجر المختار غير موجود" });
      }
      if (merchantUser.userType !== "merchant") {
        return res.status(400).json({ message: "المستخدم المختار ليس تاجرًا" });
      }
      creatorId = orderData.merchantId;
    }

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

    // التحقق من الحقول المطلوبة
    const requiredStrings = {
      orderType,
      customerName,
      customerPhone1,
      governorate,
      city,
      street,
      shippingType,
      paymentType,
    };

    for (const [key, value] of Object.entries(requiredStrings)) {
      if (!value) {
        return res.status(400).json({ message: `حقل مطلوب مفقود: ${key} ` });
      }
    }

    if (totalWeight === null || totalWeight === undefined) {
      return res.status(400).json({ message: "حقل مطلوب مفقود: totalWeight" });
    }

    // =============================================
    // --- 🚀 حساب التكلفة التلقائي ---
    // =============================================

    const calculatedOrderCost = await calculateShippingCost(
      governorate,
      city,
      shippingType,
      totalWeight,
      isVillageDelivery
    );

    // =============================================

    const newOrder = new Order({
      ...orderData,
      orderCost: calculatedOrderCost,
      createdBy: creatorId, // 👈 استخدام ID التاجر (سواء الحالي أو المختار)
      assignedDriver: orderData.assignedDriver || null, // Driver assignment
    });

    await newOrder.save();

    res.status(201).json({
      status: "success",
      message: "تم إنشاء الطلب بنجاح",
      data: {
        order: newOrder,
        calculatedCost: calculatedOrderCost,
      },
    });
  } catch (error) {
    console.error("!!! ADD ORDER CRASHED !!!", error);
    res.status(500).json({
      message: "خطأ في الخادم أثناء إنشاء الطلب",
      error: error.message,
    });
  }
};

// ... (باقي الدوال كما هي: getAllOrders, searchOrders, etc.)

exports.getAllOrders = async (req, res) => {
  try {
    const { status, q } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (q) {
      const searchRegex = new RegExp(q, "i");
      query.$or = [
        { customerName: searchRegex },
        { customerPhone1: searchRegex },
        { customerEmail: searchRegex },
      ];
    }

    const { page, limit } = req.query;
    const { data: orders, meta } = await paginate(Order, query, {
      page,
      limit,
      populate: {
        path: "createdBy",
        select: "fullName userType email phone storeName",
      },
      sort: { createdAt: -1 },
    });

    res.status(200).json({
      status: "success",
      results: orders.length,
      meta,
      data: { orders },
    });
  } catch (error) {
    console.error("!!! GET ALL ORDERS CRASHED !!!", error);
    res.status(500).json({ message: "خطأ في الخادم أثناء جلب الطلبات" });
  }
};

exports.searchOrders = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "مصطلح البحث مطلوب" });
    }

    const searchRegex = new RegExp(q, "i");

    const { page, limit } = req.query;
    const filter = {
      $or: [
        { customerName: searchRegex },
        { customerPhone1: searchRegex },
        { customerEmail: searchRegex },
      ],
    };

    const { data: orders, meta } = await paginate(Order, filter, {
      page,
      limit,
      populate: {
        path: "createdBy",
        select: "fullName userType email phone storeName",
      },
      sort: { createdAt: -1 },
    });

    res.status(200).json({
      status: "success",
      results: orders.length,
      meta,
      data: { orders },
    });
  } catch (error) {
    res.status(500).json({ message: "خطأ في البحث", error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, changeReason } = req.body;
    const userRole = req.user.userType;
    const userId = req.user._id;

    const validStatuses = [
      "Pending",
      "Processing",
      "On the Way",
      "Delivered",
      "Cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "حالة غير صحيحة" });
    }

    // Get current order
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    const currentState = currentOrder.status;

    // Role-based validation
    const stateChangeResult = validateStateChange(
      userRole,
      currentState,
      status
    );
    if (!stateChangeResult.success) {
      return res.status(403).json({
        message: stateChangeResult.message,
        error: stateChangeResult.error,
      });
    }

    // Add to state history
    const stateHistoryEntry = {
      previousState: currentState,
      newState: status,
      changedBy: userId,
      changeReason: changeReason || `State changed by ${userRole}`,
      changedAt: new Date(),
    };

    // If reverting to Pending, remove assigned driver
    const updateData = {
      status: status,
      $push: { stateHistory: stateHistoryEntry },
    };

    if (status === "Pending" && currentState === "Processing") {
      updateData.assignedDriver = null; // Remove driver assignment
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("stateHistory.changedBy", "fullName userType email");

    res.status(200).json({
      success: true,
      message: `Order status updated from ${currentState} to ${status}`,
      data: {
        order: updatedOrder,
        stateHistory: `${currentState} → ${status}`,
      },
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في الخادم أثناء تحديث الحالة",
      error: error.message,
    });
  }
};

// State change validation function
const validateStateChange = (userRole, currentState, newState) => {
  const stateTransitionRules = {
    admin: {
      Pending: ["Processing", "On the Way", "Delivered", "Cancelled"],
      Processing: ["Pending", "On the Way", "Delivered", "Cancelled"],
      "On the Way": ["Pending", "Processing", "Delivered", "Cancelled"],
      Delivered: ["Pending", "Processing", "On the Way", "Cancelled"], // Admin can undo Delivered
      Cancelled: ["Pending", "Processing", "On the Way", "Delivered"],
    },
    employee: {
      Pending: ["Processing", "Cancelled"],
      Processing: ["Pending", "Cancelled"],
      "On the Way": [],
      Delivered: [],
      Cancelled: [],
    },
    merchant: {
      Pending: [], // Merchant is READ-ONLY, cannot change anything
      Processing: [],
      "On the Way": [],
      Delivered: [],
      Cancelled: [],
    },
    courier: {
      Pending: [],
      Processing: ["On the Way", "Delivered", "Cancelled"],
      "On the Way": ["Processing", "Delivered", "Cancelled"],
      Delivered: [], // CRITICAL: Cannot revert delivered
      Cancelled: [],
    },
  };

  const allowedTransitions =
    stateTransitionRules[userRole]?.[currentState] || [];

  if (!allowedTransitions.includes(newState)) {
    let errorMessage = "Unauthorized state transition.";

    switch (userRole) {
      case "employee":
        if (currentState === "Pending") {
          errorMessage =
            "الموظف يمكنه فقط نقل الطلبات من قيد الانتظار إلى قيد المعالجة أو إلغائها";
        } else if (currentState === "Processing") {
          errorMessage =
            "الموظف يمكنه إرجاع الطلب إلى قيد الانتظار أو إلغائه فقط";
        } else if (currentState === "Delivered") {
          errorMessage =
            "الموظف لا يمكنه تعديل الطلبات المسلمة. اتصل بالمدير للتغييرات";
        } else if (currentState === "On the Way") {
          errorMessage = "الموظف لا يمكنه تعديل الطلبات التي في الطريق";
        } else {
          errorMessage = "الموظف لا يمكنه التراجع عن الطلبات الملغاة";
        }
        break;

      case "merchant":
        errorMessage =
          "Merchant has read-only access. Cannot modify order status.";
        break;

      case "courier":
        if (currentState === "Delivered") {
          errorMessage =
            "Delivery agent cannot revert delivered orders. Contact admin if there's an issue.";
        } else if (currentState === "Cancelled") {
          errorMessage = "Cannot work on cancelled orders.";
        } else if (currentState === "Pending") {
          errorMessage =
            "Delivery agent can only work on orders that are being processed.";
        } else {
          errorMessage =
            "Delivery agent can only move orders from Processing → On the Way → Delivered.";
        }
        break;
    }

    return {
      success: false,
      message: errorMessage,
      error: "UNAUTHORIZED_TRANSITION",
    };
  }

  return { success: true, message: "State transition authorized." };
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }
    res.status(200).json({ status: "success", message: "تم حذف الطلب بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "خطأ في الخادم أثناء حذف الطلب" });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const { status, q } = req.query;
    const query = { createdBy: creatorId };
    if (status && status !== "all") query.status = status;
    if (q) {
      const searchRegex = new RegExp(q, "i");
      query.$or = [
        { customerName: searchRegex },
        { customerPhone1: searchRegex },
      ];
    }
    const { page, limit } = req.query;
    const { data: orders, meta } = await paginate(Order, query, {
      page,
      limit,
      populate: { path: "createdBy", select: "fullName userType" },
      sort: { createdAt: -1 },
    });
    res.status(200).json({
      status: "success",
      results: orders.length,
      meta,
      data: { orders },
    });
  } catch (error) {
    res.status(500).json({ message: "خطأ في الخادم أثناء جلب طلباتي" });
  }
};
