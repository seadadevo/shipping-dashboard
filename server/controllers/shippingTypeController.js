const ShippingType = require("../models/ShippingType");
const { paginate } = require("../utils/pagination");

exports.addShippingType = async (req, res) => {
  try {
    const {
      name,
      adjustmentAmount,
      minDeliveryDays,
      maxDeliveryDays,
      description,
    } = req.body;
    if (!name || adjustmentAmount === undefined) {
      return res
        .status(400)
        .json({ message: "Name and adjustment amount are required" });
    }

    // التحقق من وجود نوع شحن بنفس الاسم ومفعل فقط
    const existingActiveType = await ShippingType.findOne({ name, isActive: true });
    if (existingActiveType) {
      return res
        .status(400)
        .json({ message: "نوع الشحن بهذا الاسم موجود ومفعل بالفعل" });
    }

    const newType = await ShippingType.create({
      name,
      adjustmentAmount,
      minDeliveryDays: minDeliveryDays || 2,
      maxDeliveryDays: maxDeliveryDays || 5,
      description,
    });
    res.status(201).json({ status: "success", data: newType });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "نوع الشحن بهذا الاسم موجود بالفعل" });
    }
    res.status(500).json({ message: "خطأ في الخادم", error: error.message });
  }
};

exports.getAllShippingTypes = async (req, res) => {
  try {
    const { page, limit } = req.query;
    
    const { data: types, meta } = await paginate(
      ShippingType,
      {}, 
      { page, limit, sort: { adjustmentAmount: 1 } }
    );
    res
      .status(200)
      .json({ status: "success", results: types.length, meta, data: types });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateShippingType = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📥 Received request body:", JSON.stringify(req.body, null, 2));

    const {
      name,
      adjustmentAmount,
      minDeliveryDays,
      maxDeliveryDays,
      description,
    } = req.body;

    console.log("📊 Parsed values:");
    console.log(
      "  - minDeliveryDays:",
      minDeliveryDays,
      "type:",
      typeof minDeliveryDays
    );
    console.log(
      "  - maxDeliveryDays:",
      maxDeliveryDays,
      "type:",
      typeof maxDeliveryDays
    );

    if (!name || adjustmentAmount === undefined) {
      console.log(
        "❌ Missing required fields - name:",
        name,
        "adjustmentAmount:",
        adjustmentAmount
      );
      return res.status(400).json({ message: "الاسم وقيمة التعديل مطلوبان" });
    }

    // التحقق من أن maxDeliveryDays >= minDeliveryDays
    if (minDeliveryDays !== undefined && maxDeliveryDays !== undefined) {
      console.log(
        "🔍 Comparing:",
        maxDeliveryDays,
        "<",
        minDeliveryDays,
        "=",
        maxDeliveryDays < minDeliveryDays
      );
      if (maxDeliveryDays < minDeliveryDays) {
        console.log("❌ Validation failed: max < min");
        return res.status(400).json({
          message:
            "الحد الأقصى للأيام يجب أن يكون أكبر من أو يساوي الحد الأدنى",
        });
      }
    }

    const updateData = {
      name,
      adjustmentAmount,
      description,
    };

    if (minDeliveryDays !== undefined)
      updateData.minDeliveryDays = parseInt(minDeliveryDays);
    if (maxDeliveryDays !== undefined)
      updateData.maxDeliveryDays = parseInt(maxDeliveryDays);

    console.log("🔄 Updating shipping type:", id);
    console.log("📦 Update data:", JSON.stringify(updateData, null, 2));

    const updatedType = await ShippingType.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedType) {
      return res.status(404).json({ message: "نوع الشحن غير موجود" });
    }

    console.log("✅ Updated successfully:", updatedType);
    res.status(200).json({ status: "success", data: updatedType });
  } catch (error) {
    console.error("❌ Update error:", error);
    console.error("❌ Error details:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "خطأ في التحقق من البيانات",
        error: error.message,
      });
    }
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "نوع شحن آخر بهذا الاسم موجود بالفعل" });
    }
    res.status(500).json({
      message: "خطأ في الخادم",
      error: error.message,
    });
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
      message: `تم ${type.isActive ? "تفعيل" : "إلغاء تفعيل"} نوع الشحن`,
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
    res
      .status(200)
      .json({ status: "success", message: "تم حذف نوع الشحن بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "خطأ في الخادم" });
  }
};
