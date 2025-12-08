/**
 * Weight Settings Service
 * Contains all business logic for weight settings operations
 */

const WeightSetting = require('../models/WeightSetting');
const { ValidationError } = require('../utils/errors');

class WeightSettingsService {
  /**
   * Get weight settings
   */
  async getWeightSettings() {
    let settings = await WeightSetting.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = await WeightSetting.create({
        defaultWeightLimit: 10,
        extraKgCost: 0,
        villageDeliveryCost: 0,
      });
    }

    return settings;
  }

  /**
   * Update weight settings
   */
  async updateWeightSettings(defaultWeightLimit, extraKgCost, villageDeliveryCost) {
    // Validate inputs
    if (defaultWeightLimit === undefined || extraKgCost === undefined || villageDeliveryCost === undefined) {
      throw new ValidationError('جميع الحقول مطلوبة');
    }

    if (defaultWeightLimit < 0 || extraKgCost < 0 || villageDeliveryCost < 0) {
      throw new ValidationError('القيم يجب أن تكون أرقام موجبة');
    }

    const updatedSettings = await WeightSetting.findOneAndUpdate(
      {},
      {
        defaultWeightLimit,
        extraKgCost,
        villageDeliveryCost,
        updatedAt: Date.now(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return updatedSettings;
  }
}

module.exports = new WeightSettingsService();
