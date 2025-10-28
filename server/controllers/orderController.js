const Order = require("../models/Order");


exports.addOrder = async (req, res) => {
  try {

    const orderData = req.body;

    const creatorId = req.user._id;

    
    const requiredFields = [
      'orderType', 'customerName', 'customerPhone1', 'governorate', 'city',
      'street', 'shippingType', 'paymentType', 'branch', 'orderCost', 'totalWeight', 'products'
    ];

    for (const field of requiredFields) {
      if (!orderData[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }
    
    if (!Array.isArray(orderData.products) || orderData.products.length === 0) {
       return res.status(400).json({ message: "Order must contain at least one product" });
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
    res.status(500).json({ message: "Server error while creating order", error: error.message });
  }
};


exports.getAllOrders = async (req, res) => {
  try {
   
    const orders = await Order.find()
     
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
    console.error("!!! SEARCH ORDERS CRASHED !!!", error);
    res.status(500).json({ message: "Server error while searching orders" });
  }
};