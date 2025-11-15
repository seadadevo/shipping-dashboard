const WeightSetting = require('../models/WeightSetting');

// 1. جلب الإعدادات
exports.getWeightSettings = async (req, res) => {
    try {
        let settings = await WeightSetting.findOne();
        
        if (!settings) {
            settings = await WeightSetting.create({
                defaultWeightLimit: 10,
                extraKgCost: 0,
                villageDeliveryCost: 0 // <-- إضافة السعر الافتراضي هنا
            });
        }
        res.status(200).json(settings);
    } catch (error) {
        console.error("Internal Server Error in GET:", error); 
        res.status(500).json({ message: 'Error retrieving weight settings.', error: error.message });
    }
};

// 2. تحديث الإعدادات
exports.updateWeightSettings = async (req, res) => {
    try {
        // --- إضافة villageDeliveryCost ---
        const { defaultWeightLimit, extraKgCost, villageDeliveryCost } = req.body; 
        
        const updatedSettings = await WeightSetting.findOneAndUpdate(
            {}, 
            // --- إضافته هنا ---
            { defaultWeightLimit, extraKgCost, villageDeliveryCost, updatedAt: Date.now() },
            { 
                new: true,    
                upsert: true, 
                runValidators: true
            }
        );

        res.status(200).json(updatedSettings);
    } catch (error) {
        console.error("Validation Error in PUT:", error);
        res.status(400).json({ 
            message: 'Validation failed or data is invalid.', 
            error: error.message 
        });
    }
};