require("dotenv").config();
const mongoose = require("mongoose");
const ShippingType = require("../models/ShippingType");

const updateShippingTypes = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // جلب جميع أنواع الشحن التي لا تحتوي على minDeliveryDays أو maxDeliveryDays
    const typesWithoutDays = await ShippingType.find({
      $or: [
        { minDeliveryDays: { $exists: false } },
        { maxDeliveryDays: { $exists: false } },
      ],
    });

    console.log(
      `📦 Found ${typesWithoutDays.length} shipping types without delivery days`
    );

    if (typesWithoutDays.length === 0) {
      console.log("✅ All shipping types already have delivery days set");
      process.exit(0);
    }

    // تحديث كل نوع بالقيم الافتراضية
    for (const type of typesWithoutDays) {
      type.minDeliveryDays = type.minDeliveryDays || 2;
      type.maxDeliveryDays = type.maxDeliveryDays || 5;
      await type.save();
      console.log(
        `✅ Updated: ${type.name} (${type.minDeliveryDays}-${type.maxDeliveryDays} days)`
      );
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n💡 الآن يمكنك تحديث المدة لكل نوع من لوحة التحكم");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

updateShippingTypes();
