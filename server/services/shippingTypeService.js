/**
 * Shipping Type Service
 * Contains all business logic for shipping type operations
 */

const ShippingType = require('../models/ShippingType');
const { paginate } = require('../utils/pagination');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

class ShippingTypeService {
  /**
   * Create new shipping type
   */
  async createShippingType(name, adjustmentAmount, description) {
    if (!name || adjustmentAmount === undefined) {
      throw new ValidationError('الاسم وقيمة التعديل مطلوبان');
    }

    const existingType = await ShippingType.findOne({ name });
    if (existingType) {
      throw new ConflictError('نوع الشحن بهذا الاسم موجود بالفعل');
    }

    const newType = await ShippingType.create({ name, adjustmentAmount, description });
    return newType;
  }

  /**
   * Get all shipping types
   */
  async getAllShippingTypes(paginationOptions) {
    const { data: types, meta } = await paginate(
      ShippingType,
      { isActive: true },
      { ...paginationOptions, sort: { adjustmentAmount: 1 } }
    );

    return { types, meta };
  }

  /**
   * Update shipping type
   */
  async updateShippingType(id, name, adjustmentAmount, description) {
    if (!name || adjustmentAmount === undefined) {
      throw new ValidationError('الاسم وقيمة التعديل مطلوبان');
    }

    // Check for duplicate name (excluding self)
    const existingType = await ShippingType.findOne({ name, _id: { $ne: id } });
    if (existingType) {
      throw new ConflictError('نوع شحن آخر بهذا الاسم موجود بالفعل');
    }

    const updatedType = await ShippingType.findByIdAndUpdate(
      id,
      { name, adjustmentAmount, description },
      { new: true, runValidators: true }
    );

    if (!updatedType) {
      throw new NotFoundError('نوع الشحن غير موجود');
    }

    return updatedType;
  }

  /**
   * Toggle shipping type status
   */
  async toggleShippingTypeStatus(id) {
    const type = await ShippingType.findById(id);

    if (!type) {
      throw new NotFoundError('نوع الشحن غير موجود');
    }

    type.isActive = !type.isActive;
    await type.save();

    return type;
  }

  /**
   * Delete shipping type
   */
  async deleteShippingType(id) {
    const deletedType = await ShippingType.findByIdAndDelete(id);

    if (!deletedType) {
      throw new NotFoundError('نوع الشحن غير موجود');
    }

    return deletedType;
  }
}

module.exports = new ShippingTypeService();
