const mongoose = require('mongoose');

const WeightSettingSchema = new mongoose.Schema({
    // تكلفة الشحن الافتراضية (مثلاً: 50 جنيهًا)
    defaultShippingCost: {
        type: Number,
        required: true,
        min: 0
    },
    // الوزن الأقصى المشمول بالتكلفة الافتراضية (مثلاً: 10 كجم)
    defaultWeightLimit: {
        type: Number,
        required: true,
        min: 0,
        default: 10 
    },
    // سعر كل كيلو جرام إضافي بعد الوزن الافتراضي (مثلاً: 5 جنيهات)
    extraKgCost: {
        type: Number,
        required: true,
        min: 0
    },
    // لحفظ تاريخ ووقت آخر تعديل
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const WeightSetting = mongoose.model('WeightSetting', WeightSettingSchema);

module.exports = WeightSetting;
