/**
 * Location Service
 * Contains all business logic for governorate and city operations
 */

const Governorate = require('../models/Governotate');
const City = require('../models/City');
const { paginate } = require('../utils/pagination');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../constants');

class LocationService {
  // ============= Governorate Operations =============

  /**
   * Add new governorate
   */
  async addGovernorate(govName, govCode) {
    if (!govName || !govCode) {
      throw new ValidationError(ERROR_MESSAGES.GOVERNORATE_NAME_CODE_REQUIRED);
    }

    // Check for duplicates
    const existingGov = await Governorate.findOne({ $or: [{ govName }, { govCode }] });
    if (existingGov) {
      throw new ConflictError(ERROR_MESSAGES.GOVERNORATE_DUPLICATE);
    }

    const newGovernorate = new Governorate({ govName, govCode });
    await newGovernorate.save();

    return newGovernorate;
  }

  /**
   * Get all governorates
   */
  async getAllGovernorates(paginationOptions) {
    const { data: governorates, meta } = await paginate(
      Governorate,
      {},
      { ...paginationOptions, sort: { govName: 1 } }
    );

    return { governorates, meta };
  }

  /**
   * Update governorate
   */
  async updateGovernorate(id, govName, govCode) {
    if (!govName || !govCode) {
      throw new ValidationError(ERROR_MESSAGES.GOVERNORATE_NAME_CODE_REQUIRED);
    }

    // Check for uniqueness conflict (excluding self)
    const existingGov = await Governorate.findOne({
      $or: [{ govName }, { govCode }],
      _id: { $ne: id },
    });

    if (existingGov) {
      throw new ConflictError(ERROR_MESSAGES.GOVERNORATE_DUPLICATE);
    }

    const updatedGovernorate = await Governorate.findByIdAndUpdate(
      id,
      { govName, govCode },
      { new: true, runValidators: true }
    );

    if (!updatedGovernorate) {
      throw new NotFoundError(ERROR_MESSAGES.GOVERNORATE_NOT_FOUND);
    }

    return updatedGovernorate;
  }

  /**
   * Toggle governorate status
   */
  async toggleGovernorateStatus(id) {
    const governorate = await Governorate.findById(id);

    if (!governorate) {
      throw new NotFoundError(ERROR_MESSAGES.GOVERNORATE_NOT_FOUND);
    }

    governorate.isActive = !governorate.isActive;
    await governorate.save();

    return governorate;
  }

  /**
   * Delete governorate
   */
  async deleteGovernorate(id) {
    // Check if any city is associated with this governorate
    const cityCount = await City.countDocuments({ governorate: id });
    if (cityCount > 0) {
      throw new ValidationError(ERROR_MESSAGES.GOVERNORATE_HAS_CITIES);
    }

    const deletedGovernorate = await Governorate.findByIdAndDelete(id);

    if (!deletedGovernorate) {
      throw new NotFoundError(ERROR_MESSAGES.GOVERNORATE_NOT_FOUND);
    }

    return deletedGovernorate;
  }

  // ============= City Operations =============

  /**
   * Add new city
   */
  async addCity(cityName, governorateId, shippingCost) {
    if (!cityName || !governorateId) {
      throw new ValidationError(ERROR_MESSAGES.CITY_NAME_GOVERNORATE_REQUIRED);
    }

    // Verify governorate exists
    const parentGov = await Governorate.findById(governorateId);
    if (!parentGov) {
      throw new NotFoundError(ERROR_MESSAGES.GOVERNORATE_NOT_FOUND);
    }

    // Check for duplicates
    const existingCity = await City.findOne({ cityName, governorate: governorateId });
    if (existingCity) {
      throw new ConflictError(`المدينة "${cityName}" ${ERROR_MESSAGES.CITY_DUPLICATE}`);
    }

    const newCity = new City({
      cityName,
      governorate: governorateId,
      shippingCost,
    });

    await newCity.save();

    // Populate before returning
    const populatedCity = await City.findById(newCity._id).populate(
      'governorate',
      'govName govCode'
    );

    return populatedCity;
  }

  /**
   * Get all cities
   */
  async getAllCities(paginationOptions) {
    const { data: cities, meta } = await paginate(City, {}, {
      ...paginationOptions,
      populate: { path: 'governorate', select: 'govName govCode' },
      sort: { cityName: 1 },
    });

    return { cities, meta };
  }

  /**
   * Update city
   */
  async updateCity(id, cityName, governorateId, shippingCost) {
    if (!cityName || !governorateId) {
      throw new ValidationError(ERROR_MESSAGES.CITY_NAME_GOVERNORATE_REQUIRED);
    }

    // Check for uniqueness conflict (excluding self)
    const existingCity = await City.findOne({
      cityName,
      governorate: governorateId,
      _id: { $ne: id },
    });

    if (existingCity) {
      throw new ConflictError(`المدينة "${cityName}" ${ERROR_MESSAGES.CITY_DUPLICATE}`);
    }

    const updatedCity = await City.findByIdAndUpdate(
      id,
      { cityName, governorate: governorateId, shippingCost },
      { new: true, runValidators: true }
    ).populate('governorate', 'govName govCode');

    if (!updatedCity) {
      throw new NotFoundError(ERROR_MESSAGES.CITY_NOT_FOUND);
    }

    return updatedCity;
  }

  /**
   * Toggle city status
   */
  async toggleCityStatus(id) {
    const city = await City.findById(id);

    if (!city) {
      throw new NotFoundError(ERROR_MESSAGES.CITY_NOT_FOUND);
    }

    city.isActive = !city.isActive;
    await city.save();

    const populatedCity = await City.findById(city._id).populate(
      'governorate',
      'govName govCode'
    );

    return populatedCity;
  }

  /**
   * Delete city
   */
  async deleteCity(id) {
    const deletedCity = await City.findByIdAndDelete(id);

    if (!deletedCity) {
      throw new NotFoundError(ERROR_MESSAGES.CITY_NOT_FOUND);
    }

    return deletedCity;
  }

  /**
   * Get cities by governorate
   */
  async getCitiesByGovernorate(govId, paginationOptions) {
    if (!govId) {
      throw new ValidationError('معرف المحافظة مطلوب');
    }

    const { data: cities, meta } = await paginate(
      City,
      { governorate: govId, isActive: true },
      {
        ...paginationOptions,
        populate: { path: 'governorate', select: 'govName govCode' },
        sort: { cityName: 1 },
      }
    );

    return { cities, meta };
  }
}

module.exports = new LocationService();
