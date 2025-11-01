const Order = require("../models/Order");

exports.addOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const creatorId = req.user._id;

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
      orderCost,
      totalWeight,
      products,
    } = orderData; 

    const requiredStrings = {
      orderType,
      customerName,
      customerPhone1,
      governorate,
      city,
      street,
      shippingType,
      paymentType,
      branch,
    };
    for (const [key, value] of Object.entries(requiredStrings)) {
      if (!value) {
        return res
          .status(400)
          .json({ message: `Missing required field: ${key} `});
      }
    } 
    if (orderCost === null || orderCost === undefined) {
      return res
        .status(400)
        .json({ message: "Missing required field: orderCost" });
    }
    if (totalWeight === null || totalWeight === undefined) {
      return res
        .status(400)
        .json({ message: "Missing required field: totalWeight" });
    }
    if (!Array.isArray(orderData.products) || orderData.products.length === 0) {
      return res
        .status(400)
        .json({ message: "Order must have at least one product" });
    }

    const newOrder = new Order({
      ...orderData,
      createdBy: creatorId,
    });

    await newOrder.save();

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      data: {
        order: newOrder,
      },
    });
  } catch (error) {

    console.error("!!! ADD ORDER CRASHED !!!", error); 
    res
      .status(500)
      .json({
        message: "Server error while creating order",
        error: error.message,
      });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    // 1. قراءة متغيرات الفلترة والبحث من الرابط
    // (مثال: /api/orders?status=Pending&q=احمد)
    const { status, q } = req.query;

    // 2. بناء جملة الاستعلام (Query)
    const query = {};

    // 3. إضافة فلتر الحالة (Status)
    // هنتأكد إن الحالة جاية ومش "all"
    if (status && status !== 'all') {
      // query.status لازم تكون القيمة الإنجليزية (Pending, Shipped, etc.)
      query.status = status;
    }

    // 4. إضافة فلتر البحث (Search)
    // لو المستخدم كتب حاجة في خانة البحث (q)
    if (q) {
      const searchRegex = new RegExp(q, "i");
      query.$or = [
        { customerName: searchRegex },
        { customerPhone1: searchRegex },
        { customerEmail: searchRegex },
      ];
    }

    // 5. تنفيذ الاستعلام المجمع (فلترة + بحث)
    const orders = await Order.find(query) // <-- استخدام الـ query المجمع
      .populate("createdBy", "fullName userType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: {
        orders,
      },
    });

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

    const orders = await Order.find({
      $or: [
        { customerName: searchRegex },
        { customerPhone1: searchRegex },
        { customerEmail: searchRegex },
      ],
    }).populate("createdBy", "fullName userType");

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: {
        orders,
      },
    });
  } catch (error) {
    console.error("!!! ADD ORDER CRASHED !!!", error);
    res
      .status(500)
      .json({
        message: "Server error while creating order",
        error: error.message,
      });
  }
};