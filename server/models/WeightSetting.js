const mongoose = require('mongoose');

const WeightSettingSchema = new mongoose.Schema({
    defaultWeightLimit: {
        type: Number,
        required: true,
        min: 0,
        default: 10 
    },
    extraKgCost: {
        type: Number,
        required: true,
        min: 0
    },
    villageDeliveryCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0 
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const WeightSetting = mongoose.model('WeightSetting', WeightSettingSchema);

module.exports = WeightSetting;