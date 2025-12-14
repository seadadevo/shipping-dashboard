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
        res.status(500).json({ message: 'خطأ في جلب إعدادات الوزن', error: error.message });
    }
};

// 2. تحديث الإعدادات
exports.updateWeightSettings = async (req, res) => {
    try {
        const { defaultWeightLimit, extraKgCost, villageDeliveryCost } = req.body; 
        
        // بناء الـ update object ديناميكياً
        const updateData = { updatedAt: Date.now() };
        if (defaultWeightLimit !== undefined) updateData.defaultWeightLimit = defaultWeightLimit;
        if (extraKgCost !== undefined) updateData.extraKgCost = extraKgCost;
        if (villageDeliveryCost !== undefined) updateData.villageDeliveryCost = villageDeliveryCost;
        
        const updatedSettings = await WeightSetting.findOneAndUpdate(
            {}, 
            updateData,
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
            message: 'فشل التحقق من البيانات أو البيانات غير صحيحة', 
            error: error.message 
        });
    }
};