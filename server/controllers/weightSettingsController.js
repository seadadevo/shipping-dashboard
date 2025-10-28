const WeightSetting = require('../models/WeightSetting');

// 1. جلب الإعدادات (GET /api/weight-settings)
exports.getWeightSettings = async (req, res) => {
    try {
        let settings = await WeightSetting.findOne();
        
        // إذا لم يتم العثور عليها (أول تشغيل)، قم بإنشاء إعدادات افتراضية
        if (!settings) {
            settings = await WeightSetting.create({
                defaultShippingCost: 0,
                defaultWeightLimit: 10,
                extraKgCost: 0
            });
        }
        res.status(200).json(settings);
    } catch (error) {
        // [مهم] اطبع الخطأ في الـ Terminal لفهم السبب
        console.error("Internal Server Error in GET:", error); 
        res.status(500).json({ message: 'Error retrieving weight settings.', error: error.message });
    }
};

// 2. تحديث الإعدادات (PUT /api/weight-settings)
exports.updateWeightSettings = async (req, res) => {
    try {
        // [مهم]: تأكد أنك تستخدم جميع الحقول المطلوبة (required: true) في الـ Schema
        const { defaultShippingCost, defaultWeightLimit, extraKgCost } = req.body;
        
        const updatedSettings = await WeightSetting.findOneAndUpdate(
            {}, 
            { defaultShippingCost, defaultWeightLimit, extraKgCost, updatedAt: Date.now() },
            { 
                new: true,    
                upsert: true, 
                runValidators: true // هذا سيسبب الـ 400 إذا كانت البيانات غير صالحة
            }
        );

        res.status(200).json(updatedSettings);
    } catch (error) {
        // [مهم] اطبع الخطأ الحقيقي هنا أيضًا
        console.error("Validation Error in PUT:", error);
        // غالبًا يكون خطأ 400 هو Validation Error من Mongoose
        res.status(400).json({ 
            message: 'Validation failed or data is invalid.', 
            error: error.message 
        });
    }
};