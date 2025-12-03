const ShippingType = require('../models/ShippingType');
const { paginate } = require('../utils/pagination');

// 1. إضافة نوع شحن (Admin)
exports.addShippingType = async (req, res) => {
    try {
        const { name, adjustmentAmount, description } = req.body;
        if (!name || adjustmentAmount === undefined) {
            return res.status(400).json({ message: 'Name and adjustment amount are required' });
        }
        
        const newType = await ShippingType.create({ name, adjustmentAmount, description });
        res.status(201).json({ status: 'success', data: newType });
        
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'نوع الشحن بهذا الاسم موجود بالفعل' });
        }
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
};

// 2. جلب كل أنواع الشحن (Any User)
exports.getAllShippingTypes = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const { data: types, meta } = await paginate(ShippingType, { isActive: true }, { page, limit, sort: { adjustmentAmount: 1 } });
        res.status(200).json({ status: 'success', results: types.length, meta, data: types });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 3. تحديث نوع الشحن (Admin)
exports.updateShippingType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, adjustmentAmount, description } = req.body;
        
        if (!name || adjustmentAmount === undefined) {
            return res.status(400).json({ message: 'الاسم وقيمة التعديل مطلوبان' });
        }

        const updatedType = await ShippingType.findByIdAndUpdate(
            id,
            { name, adjustmentAmount, description },
            { new: true, runValidators: true }
        );
        
        if (!updatedType) {
            return res.status(404).json({ message: 'نوع الشحن غير موجود' });
        }
        res.status(200).json({ status: 'success', data: updatedType });
        
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'نوع شحن آخر بهذا الاسم موجود بالفعل' });
        }
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
};

// 4. تفعيل/تعطيل نوع الشحن (Admin)
exports.toggleShippingTypeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const type = await ShippingType.findById(id);

        if (!type) {
            return res.status(404).json({ message: "نوع الشحن غير موجود" });
        }

        type.isActive = !type.isActive;
        await type.save();

        res.status(200).json({
            status: "success",
            message: `تم ${type.isActive ? 'تفعيل' : 'إلغاء تفعيل'} نوع الشحن`,
            data: type,
        });
    } catch (error) {
        res.status(500).json({ message: "خطأ في الخادم" });
    }
};

// 5. حذف نوع الشحن (Admin)
exports.deleteShippingType = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedType = await ShippingType.findByIdAndDelete(id);

        if (!deletedType) {
            return res.status(404).json({ message: "نوع الشحن غير موجود" });
        }
        res.status(200).json({ status: "success", message: "تم حذف نوع الشحن بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "خطأ في الخادم" });
    }
};