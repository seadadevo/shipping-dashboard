require("dotenv").config();
const mongoose = require("mongoose");
const ShippingType = require("../models/ShippingType");

const checkShippingTypes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const allTypes = await ShippingType.find();

    console.log(`📦 Total shipping types: ${allTypes.length}\n`);

    allTypes.forEach((type, index) => {
      console.log(`${index + 1}. ${type.name}`);
      console.log(`   - Adjustment: ${type.adjustmentAmount} ج.م`);
      console.log(`   - Min Days: ${type.minDeliveryDays || "NOT SET"}`);
      console.log(`   - Max Days: ${type.maxDeliveryDays || "NOT SET"}`);
      console.log(`   - Active: ${type.isActive}`);
      console.log(`   - ID: ${type._id}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkShippingTypes();
