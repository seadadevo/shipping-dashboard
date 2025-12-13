const mongoose = require('mongoose');

const WeightSettingSchema = new mongoose.Schema({
    // الوزن الأقصى المشمول بالتكلفة الافتراضية
    defaultWeightLimit: {
        type: Number,
        required: true,
        min: 0,
        default: 10 
    },
    // سعر كل كيلو جرام إضافي
    extraKgCost: {
        type: Number,
        required: true,
        min: 0
    },
    // --- الإضافة الجديدة ---
    // سعر التوصيل للقرى (سعر ثابت)
    villageDeliveryCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0 // (نبدأ بصفر)
    },
    // --- نهاية الإضافة ---
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const WeightSetting = mongoose.model('WeightSetting', WeightSettingSchema);

module.exports = WeightSetting;