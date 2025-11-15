const express = require('express');
const router = express.Router();
const {
    addShippingType,
    getAllShippingTypes,
    updateShippingType,
    toggleShippingTypeStatus,
    deleteShippingType
} = require('../controllers/shippingTypeController');

const { protect, restrictTo } = require('../middleware/authMiddleware');

// جلب الكل وإضافة جديد
router.route('/')
    .get(protect, getAllShippingTypes)
    .post(protect, restrictTo('admin'), addShippingType);

// تحديث وحذف
router.route('/:id')
    .put(protect, restrictTo('admin'), updateShippingType)
    .delete(protect, restrictTo('admin'), deleteShippingType);

// تفعيل/تعطيل
router.patch('/toggle/:id', protect, restrictTo('admin'), toggleShippingTypeStatus);

module.exports = router;