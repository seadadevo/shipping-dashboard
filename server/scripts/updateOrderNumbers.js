const mongoose = require('mongoose');
const Order = require('../models/Order');
require('dotenv').config();

const updateOrderNumbers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shipping-dashboard');
    console.log('✅ Connected to database');

    // Find all orders without orderNumber
    const ordersWithoutNumber = await Order.find({ 
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: '' }
      ]
    }).sort({ createdAt: 1 });

    console.log(`📦 Found ${ordersWithoutNumber.length} orders without orderNumber`);

    if (ordersWithoutNumber.length === 0) {
      console.log('✅ All orders already have orderNumber');
      process.exit(0);
    }

    // Update each order
    let count = 0;
    for (const order of ordersWithoutNumber) {
      count++;
      const timestamp = new Date(order.createdAt).getTime();
      order.orderNumber = `ORD-${timestamp}-${count.toString().padStart(4, '0')}`;
      
      try {
        await order.save({ validateBeforeSave: false });
        console.log(`✓ Updated order ${order._id} with orderNumber: ${order.orderNumber}`);
      } catch (err) {
        console.log(`⚠ Skipping order ${order._id}: ${err.message}`);
        continue;
      }
    }

    console.log(`\n✅ Successfully updated ${count} orders`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating orders:', error);
    process.exit(1);
  }
};

updateOrderNumbers();
