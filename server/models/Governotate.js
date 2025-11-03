const mongoose = require("mongoose");

const governorateSchema = new mongoose.Schema({
  govName: {
    type: String,
    required: [true, "Governorate name is required"],
    unique: true,
    trim: true,
  },
  govCode: {
    type: String,
    required: [true, "Governorate code is required"],
    unique: true,
    uppercase: true,
    trim: true,
  },
  // --- ADDED ---
  isActive: {
    type: Boolean,
    default: true,
  },
  // --- END ADDED ---
}, { timestamps: true });

module.exports = mongoose.model("Governorate", governorateSchema);