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
      const { status } = req.body;
      const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status provided" });
      }
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status: status }, 
        { new: true, runValidators: true }
      );
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(200).json({ status: "success", data: { order: updatedOrder } });
    } catch (error) {
      res.status(500).json({ message: "Server error while updating status" });
    }
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