const mongoose = require("mongoose");

const shippingTypeSchema = new mongoose.Schema(
  {
  
    name: {
      type: String,
      required: [true, "Shipping type name is required"],
      unique: true,
      trim: true,
    },
  
    adjustmentAmount: {
      type: Number,
      required: [true, "Adjustment amount is required"],
      default: 0,
    },
    minDeliveryDays: {
      type: Number,
      required: [true, "Minimum delivery days is required"],
      default: 2,
      min: [1, "Minimum delivery days must be at least 1"],
    },
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
