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
    if (error.code === 11000) {
       return res.status(400).json({ message: "Governorate name or code already exists" });
    }
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

// --- ADDED: Update Governorate ---
exports.updateGovernorate = async (req, res) => {
  try {
    const { id } = req.params;
    const { govName, govCode } = req.body;

    if (!govName || !govCode) {
      return res.status(400).json({ message: "Governorate name and code are required" });
    }
    
    // Check for uniqueness conflict (excluding self)
    const existingGov = await Governorate.findOne({ 
      $or: [{ govName }, { govCode }], 
      _id: { $ne: id } 
    });
    if (existingGov) {
      return res.status(400).json({ message: "Governorate name or code already exists" });
    }

    const updatedGovernorate = await Governorate.findByIdAndUpdate(
      id,
      { govName, govCode },
      { new: true, runValidators: true }
    );

    if (!updatedGovernorate) {
      return res.status(404).json({ message: "Governorate not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Governorate updated successfully",
      data: updatedGovernorate,
    });
  } catch (error) {
     if (error.code === 11000) {
       return res.status(400).json({ message: "Governorate name or code already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- ADDED: Toggle Governorate Status ---
exports.toggleGovernorateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const governorate = await Governorate.findById(id);

        if (!governorate) {
            return res.status(404).json({ message: "Governorate not found" });
        }

        governorate.isActive = !governorate.isActive;
        await governorate.save();

        res.status(200).json({
            status: "success",
            message: `Governorate status set to ${governorate.isActive ? 'active' : 'inactive'}`,
            data: governorate,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// --- ADDED: Delete Governorate ---
exports.deleteGovernorate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any city is associated with this governorate
    const cityCount = await City.countDocuments({ governorate: id });
    if (cityCount > 0) {
      return res.status(400).json({ message: "Cannot delete governorate. It has associated cities." });
    }

    const deletedGovernorate = await Governorate.findByIdAndDelete(id);

    if (!deletedGovernorate) {
      return res.status(404).json({ message: "Governorate not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Governorate deleted successfully",
      data: null,
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
     
    const parentGov = await Governorate.findById(governorateId);
    if (!parentGov) {
      return res.status(404).json({ message: "Governorate not found" });
    }

    const existingCity = await City.findOne({ cityName, governorate: governorateId });
    if (existingCity) {
        return res.status(400).json({ message: `City "${cityName}" already exists in this governorate` });
    }

    const newCity = new City({
      cityName,
      governorate: governorateId,
      shippingCost,
    });
    await newCity.save();
    
    // Populate before sending
    const populatedCity = await City.findById(newCity._id).populate("governorate", "govName govCode");

    res.status(201).json({
      status: "success",
      message: "City added successfully",
      data: populatedCity, // Send populated data
    });

  } catch (error) {
     console.error("ADD CITY ERROR:", error);
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

// --- ADDED: Update City ---
exports.updateCity = async (req, res) => {
    try {
        const { id } = req.params;
        const { cityName, governorateId, shippingCost } = req.body;

        if (!cityName || !governorateId) {
            return res.status(400).json({ message: "City name and governorate ID are required" });
        }
        
        // Check for uniqueness conflict (excluding self)
        const existingCity = await City.findOne({ 
            cityName, 
            governorate: governorateId, 
            _id: { $ne: id } 
        });
        if (existingCity) {
            return res.status(400).json({ message: `City "${cityName}" already exists in this governorate` });
        }
        
        const updatedCity = await City.findByIdAndUpdate(
            id,
            { cityName, governorate: governorateId, shippingCost },
            { new: true, runValidators: true }
        ).populate("governorate", "govName govCode");

        if (!updatedCity) {
            return res.status(404).json({ message: "City not found" });
        }

        res.status(200).json({
            status: "success",
            message: "City updated successfully",
            data: updatedCity,
        });
    } catch (error) {
         if (error.code === 11000) {
            return res.status(400).json({ message: `City "${req.body.cityName}" already exists in this governorate` });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- ADDED: Toggle City Status ---
exports.toggleCityStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const city = await City.findById(id);

        if (!city) {
            return res.status(404).json({ message: "City not found" });
        }

        city.isActive = !city.isActive;
        await city.save();
        
        const populatedCity = await City.findById(city._id).populate("governorate", "govName govCode");

        res.status(200).json({
            status: "success",
            message: `City status set to ${city.isActive ? 'active' : 'inactive'}`,
            data: populatedCity,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


// --- ADDED: Delete City ---
exports.deleteCity = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCity = await City.findByIdAndDelete(id);

        if (!deletedCity) {
            return res.status(404).json({ message: "City not found" });
        }

        res.status(200).json({
            status: "success",
            message: "City deleted successfully",
            data: null,
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