const ShippingType = require('../models/ShippingType');

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
            return res.status(400).json({ message: 'Shipping type with this name already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 2. جلب كل أنواع الشحن (Any User)
exports.getAllShippingTypes = async (req, res) => {
    try {
        // ---- ADDED FILTER ----
        const types = await ShippingType.find({ isActive: true }).sort({ adjustmentAmount: 1 });
        // ---- END ADDED ----
        res.status(200).json({
            status: 'success',
            results: types.length,
            data: types
        });
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
            return res.status(400).json({ message: 'Name and adjustment amount are required' });
        }

        const updatedType = await ShippingType.findByIdAndUpdate(
            id,
            { name, adjustmentAmount, description },
            { new: true, runValidators: true }
        );
        
        if (!updatedType) {
            return res.status(404).json({ message: 'Shipping type not found' });
        }
        res.status(200).json({ status: 'success', data: updatedType });
        
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Another shipping type with this name already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 4. تفعيل/تعطيل نوع الشحن (Admin)
exports.toggleShippingTypeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const type = await ShippingType.findById(id);

        if (!type) {
            return res.status(404).json({ message: "Shipping type not found" });
        }

        type.isActive = !type.isActive;
        await type.save();

        res.status(200).json({
            status: "success",
            message: `Shipping type status set to ${type.isActive ? 'active' : 'inactive'}`,
            data: type,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// 5. حذف نوع الشحن (Admin)
exports.deleteShippingType = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedType = await ShippingType.findByIdAndDelete(id);

        if (!deletedType) {
            return res.status(404).json({ message: "Shipping type not found" });
        }
        res.status(200).json({ status: "success", message: "Shipping type deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};