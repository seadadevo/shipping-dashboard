const mongoose = require('mongoose');

const shippingTypeSchema = new mongoose.Schema({
    // (عادي، شحن خلال 24 ساعة، ...)
    name: {
        type: String,
        required: [true, 'Shipping type name is required'],
        unique: true,
        trim: true
    },
    // قيمة التعديل (إضافة أو خصم)
    // 0 للشحن العادي
    // 50 للشحن السريع (إضافة)
    // -20 للشحن البطيء (خصم)
    adjustmentAmount: {
        type: Number,
        required: [true, 'Adjustment amount is required'],
        default: 0
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ShippingType', shippingTypeSchema);