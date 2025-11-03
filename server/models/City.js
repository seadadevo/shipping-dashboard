const mongoose = require("mongoose");

const citySchema = new mongoose.Schema({
  cityName: {
    type: String,
    required: [true, "City name is required"],
    trim: true,
  },
  governorate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Governorate",
    required: [true, "Governorate is required"],
  },
  shippingCost: {
    type: Number,
    required: [true, "Shipping cost is required"],
    default: 0,
  },
  // --- ADDED ---
  isActive: {
    type: Boolean,
    default: true,
  },
  // --- END ADDED ---
}, { timestamps: true });

// Prevent duplicate city names within the same governorate
citySchema.index({ cityName: 1, governorate: 1 }, { unique: true });

module.exports = mongoose.model("City", citySchema);