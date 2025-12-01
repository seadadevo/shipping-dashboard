const Order = require("../models/Order");
const User = require("../models/User"); // 👈 ده السطر اللي كان ناقص ومسبب المشكلة
const { paginate } = require("../utils/pagination");

// --- باقي الموديلات ---
const WeightSetting = require("../models/WeightSetting");
const Governorate = require("../models/Governotate"); 
const City = require("../models/City");
const ShippingType = require("../models/ShippingType");

exports.addOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // 1. تحديد صاحب الطلب (creatorId)
    let creatorId = req.user._id; // الافتراضي: المستخدم الحالي

    // لو المستخدم (أدمن أو موظف) وباعِت merchantId، نستخدمه
    if (["admin", "employee"].includes(req.user.userType) && orderData.merchantId) {
        const merchantUser = await User.findById(orderData.merchantId); // 👈 هنا كان بيحصل الخطأ
        if (!merchantUser) {
            return res.status(404).json({ message: "Selected merchant not found" });
        }
        if (merchantUser.userType !== 'merchant') {
             return res.status(400).json({ message: "The selected user is not a merchant" });
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
      branch,
      totalWeight,
      products,
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
        paymentType
    };

    for (const [key, value] of Object.entries(requiredStrings)) {
      if (!value) {
        return res
          .status(400)
          .json({ message:`Missing required field: ${key} ` });
      }
    } 

    if (totalWeight === null || totalWeight === undefined) {
      return res
        .status(400)
        .json({ message: "Missing required field: totalWeight" });
    }

    // =============================================
    // --- 🚀 حساب التكلفة التلقائي ---
    // =============================================

    // جلب الإعدادات
    const weightSettings = await WeightSetting.findOne();
    const govDoc = await Governorate.findOne({ govName: governorate });
    const cityDoc = await City.findOne({ cityName: city, governorate: govDoc?._id });
    const shippingTypeDoc = await ShippingType.findOne({ name: shippingType });

    // التحقق من صحة البيانات
    if (!weightSettings) return res.status(500).json({ message: "Weight settings are not configured." });
    if (!govDoc || !cityDoc) return res.status(400).json({ message: `Invalid governorate or city name` });
    if (!cityDoc.isActive) return res.status(400).json({ message: `The selected city is disabled.` });
    if (!shippingTypeDoc) return res.status(400).json({ message: `Invalid shipping type` });
    if (!shippingTypeDoc.isActive) return res.status(400).json({ message: `The selected shipping type is disabled.` });
    
    // استخراج القيم
    const baseCityCostPerKg = cityDoc.shippingCost; 
    const { defaultWeightLimit, extraKgCost, villageDeliveryCost } = weightSettings;
    const shippingAdjustment = shippingTypeDoc.adjustmentAmount; 

    // حساب تكلفة الوزن
    let weightCost = 0;
    if (totalWeight <= defaultWeightLimit) {
        weightCost = totalWeight * baseCityCostPerKg; 
    } else {
        const defaultWeightCost = defaultWeightLimit * baseCityCostPerKg;
        const extraWeight = totalWeight - defaultWeightLimit;
        const extraWeightCost = extraWeight * extraKgCost;
        weightCost = defaultWeightCost + extraWeightCost;
    }

    // حساب تكلفة القرية
    const villageCost = (isVillageDelivery === true) ? villageDeliveryCost : 0;
    
    // التكلفة النهائية
    const calculatedOrderCost = weightCost + shippingAdjustment + villageCost;

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
      message: "Order created successfully",
      data: {
        order: newOrder,
        calculatedCost: calculatedOrderCost, 
      },
    });

  } catch (error) {
    console.error("!!! ADD ORDER CRASHED !!!", error); 
    res.status(500).json({
        message: "Server error while creating order",
        error: error.message,
      });
  }
};

// ... (باقي الدوال كما هي: getAllOrders, searchOrders, etc.)

exports.getAllOrders = async (req, res) => {
    try {
      const { status, q } = req.query;
      const query = {};
  
      if (status && status !== 'all') {
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
            populate: { path: "createdBy", select: "fullName userType email phone storeName" },
            sort: { createdAt: -1 },
          });

          res.status(200).json({ status: "success", results: orders.length, meta, data: { orders } });
  
    } catch (error) {
      console.error("!!! GET ALL ORDERS CRASHED !!!", error);
      res.status(500).json({ message: "Server error while fetching orders" });
    }
  };


exports.searchOrders = async (req, res) => {
    try {
      const { q } = req.query;
  
      if (!q) {
        return res.status(400).json({ message: "Search query (q) is required" });
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
        populate: { path: "createdBy", select: "fullName userType email phone storeName" },
        sort: { createdAt: -1 },
      });

      res.status(200).json({ status: "success", results: orders.length, meta, data: { orders } });
    } catch (error) {
        res.status(500).json({message: "Search Error", error: error.message});
    }
  };
  
  exports.updateOrderStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, changeReason } = req.body;
      const userRole = req.user.userType;
      const userId = req.user._id;
      
      const validStatuses = ["Pending", "Processing", "On the Way", "Delivered", "Cancelled"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status provided" });
      }

      // Get current order
      const currentOrder = await Order.findById(id);
      if (!currentOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      const currentState = currentOrder.status;
      
      // Role-based validation
      const stateChangeResult = validateStateChange(userRole, currentState, status);
      if (!stateChangeResult.success) {
        return res.status(403).json({ 
          message: stateChangeResult.message,
          error: stateChangeResult.error 
        });
      }

      // Add to state history
      const stateHistoryEntry = {
        previousState: currentState,
        newState: status,
        changedBy: userId,
        changeReason: changeReason || `State changed by ${userRole}`,
        changedAt: new Date()
      };

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { 
          status: status,
          $push: { stateHistory: stateHistoryEntry }
        }, 
        { new: true, runValidators: true }
      ).populate('stateHistory.changedBy', 'fullName userType email');

      res.status(200).json({ 
        success: true,
        message: `Order status updated from ${currentState} to ${status}`,
        data: { 
          order: updatedOrder,
          stateHistory: `${currentState} → ${status}`
        }
      });
    } catch (error) {
      console.error("Update Order Status Error:", error);
      res.status(500).json({ 
        success: false,
        message: "Server error while updating status",
        error: error.message 
      });
    }
  };

  // State change validation function
  const validateStateChange = (userRole, currentState, newState) => {
    const stateTransitionRules = {
      admin: {
        'Pending': ['Processing', 'On the Way', 'Delivered', 'Cancelled'],
        'Processing': ['Pending', 'On the Way', 'Delivered', 'Cancelled'],
        'On the Way': ['Pending', 'Processing', 'Delivered', 'Cancelled'],
        'Delivered': ['Pending', 'Processing', 'On the Way', 'Cancelled'], // Admin can undo Delivered
        'Cancelled': ['Pending', 'Processing', 'On the Way', 'Delivered']
      },
      employee: {
        'Pending': ['Processing', 'Cancelled'],
        'Processing': ['Cancelled'],
        'On the Way': [],
        'Delivered': [],
        'Cancelled': []
      },
      merchant: {
        'Pending': [], // Merchant is READ-ONLY, cannot change anything
        'Processing': [],
        'On the Way': [],
        'Delivered': [],
        'Cancelled': []
      },
      courier: {
        'Pending': [],
        'Processing': ['On the Way'],
        'On the Way': ['Delivered'],
        'Delivered': [], // CRITICAL: Cannot revert delivered
        'Cancelled': []
      }
    };

    const allowedTransitions = stateTransitionRules[userRole]?.[currentState] || [];
    
    if (!allowedTransitions.includes(newState)) {
      let errorMessage = "Unauthorized state transition.";
      
      switch (userRole) {
        case 'employee':
          if (currentState === 'Pending') {
            errorMessage = "Employee can only move orders from Pending to Processing or cancel them.";
          } else if (currentState === 'Processing') {
            errorMessage = "Employee can only cancel orders that haven't been shipped yet.";
          } else if (currentState === 'Delivered') {
            errorMessage = "Employee cannot modify delivered orders. Contact admin for changes.";
          } else if (currentState === 'On the Way') {
            errorMessage = "Employee cannot modify orders that are out for delivery.";
          } else {
            errorMessage = "Employee cannot undo cancelled orders.";
          }
          break;
          
        case 'merchant':
          errorMessage = "Merchant has read-only access. Cannot modify order status.";
          break;
          
        case 'courier':
          if (currentState === 'Delivered') {
            errorMessage = "Delivery agent cannot revert delivered orders. Contact admin if there's an issue.";
          } else if (currentState === 'Cancelled') {
            errorMessage = "Cannot work on cancelled orders.";
          } else if (currentState === 'Pending') {
            errorMessage = "Delivery agent can only work on orders that are being processed.";
          } else {
            errorMessage = "Delivery agent can only move orders from Processing → On the Way → Delivered.";
          }
          break;
      }
      
      return { success: false, message: errorMessage, error: "UNAUTHORIZED_TRANSITION" };
    }

    return { success: true, message: "State transition authorized." };
  };
  
  exports.deleteOrder = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedOrder = await Order.findByIdAndDelete(id);
      if (!deletedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(200).json({ status: "success", message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error while deleting order" });
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
        query.$or = [{ customerName: searchRegex }, { customerPhone1: searchRegex }];
      }
      const { page, limit } = req.query;
      const { data: orders, meta } = await paginate(Order, query, {
        page,
        limit,
        populate: { path: "createdBy", select: "fullName userType" },
        sort: { createdAt: -1 },
      });
      res.status(200).json({ status: "success", results: orders.length, meta, data: { orders } });
    } catch (error) {
      res.status(500).json({ message: "Server error while fetching my orders" });
    }
  };