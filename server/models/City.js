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
  isActive: {
    type: Boolean,
    default: true,
  },
  
}, { timestamps: true });

citySchema.index({ cityName: 1, governorate: 1 }, { unique: true });

module.exports = mongoose.model("City", citySchema);