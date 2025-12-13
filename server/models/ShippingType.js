const mongoose = require("mongoose");

const shippingTypeSchema = new mongoose.Schema(
  {
    // (عادي، شحن خلال 24 ساعة، ...)
    name: {
      type: String,
      required: [true, "Shipping type name is required"],
      unique: true,
      trim: true,
    },
    // قيمة التعديل (إضافة أو خصم)
    // 0 للشحن العادي
    // 50 للشحن السريع (إضافة)
    // -20 للشحن البطيء (خصم)
    adjustmentAmount: {
      type: Number,
      required: [true, "Adjustment amount is required"],
      default: 0,
    },
    // الحد الأدنى لأيام التوصيل
    minDeliveryDays: {
      type: Number,
      required: [true, "Minimum delivery days is required"],
      default: 2,
      min: [1, "Minimum delivery days must be at least 1"],
    },
    // الحد الأقصى لأيام التوصيل
    maxDeliveryDays: {
      type: Number,
      required: [true, "Maximum delivery days is required"],
      default: 5,
      min: [1, "Maximum delivery days must be at least 1"],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShippingType", shippingTypeSchema);
