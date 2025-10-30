const Governorate = require("../models/Governotate");
const City = require("../models/City");

// --- Governorate Controllers ---

exports.addGovernorate = async (req, res) => {
  try {
    const { govName, govCode } = req.body;

    if (!govName || !govCode) {
      return res.status(400).json({ message: "Governorate name and code are required" });
    }

    // Check for duplicates
    const existingGov = await Governorate.findOne({ $or: [{ govName }, { govCode }] });
    if (existingGov) {
      return res.status(400).json({ message: "Governorate name or code already exists" });
    }

    const newGovernorate = new Governorate({ govName, govCode });
    await newGovernorate.save();

    res.status(201).json({
      status: "success",
      message: "Governorate added successfully",
      data: newGovernorate,
    });
  } catch (error) {
    console.error("ADD GOVERNORATE ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllGovernorates = async (req, res) => {
  try {
    const governorates = await Governorate.find().sort({ govName: 1 });
    res.status(200).json({
      status: "success",
      results: governorates.length,
      data: governorates,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- City Controllers ---

exports.addCity = async (req, res) => {
  try {
    const { cityName, governorateId, shippingCost } = req.body;

    if (!cityName || !governorateId) {
      return res.status(400).json({ message: "City name and governorate ID are required" });
    }
     
    // Check if governorate exists
    const parentGov = await Governorate.findById(governorateId);
    if (!parentGov) {
      return res.status(404).json({ message: "Governorate not found" });
    }

    // Check for duplicate city in the same governorate
    const existingCity = await City.findOne({ cityName, governorate: governorateId });
    if (existingCity) {
        return res.status(400).json({ message: `City "${cityName}" already exists in this governorate` });
    }

    const newCity = new City({
      cityName,
      governorate: governorateId,
      shippingCost, // Will use default if not provided
    });
    await newCity.save();

    res.status(201).json({
      status: "success",
      message: "City added successfully",
      data: newCity,
    });

  } catch (error) {
     console.error("ADD CITY ERROR:", error);
     // Handle duplicate key error nicely
     if (error.code === 11000) {
         return res.status(400).json({ message: `City "${req.body.cityName}" already exists in this governorate` });
     }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllCities = async (req, res) => {
  try {
    const cities = await City.find()
      .populate("governorate", "govName govCode")
      .sort({ "governorate.govName": 1, cityName: 1 });
      
    res.status(200).json({
      status: "success",
      results: cities.length,
      data: cities,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCitiesByGovernorate = async (req, res) => {
    try {
        const { govId } = req.params;
        if (!govId) {
             return res.status(400).json({ message: "Governorate ID is required" });
        }
        
        const cities = await City.find({ governorate: govId })
            .populate("governorate", "govName govCode")
            .sort({ cityName: 1 });

        res.status(200).json({
            status: "success",
            results: cities.length,
            data: cities
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
