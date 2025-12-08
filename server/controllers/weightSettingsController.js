/**
 * Weight Settings Controller (Refactored - Clean Code)
 * Thin controller that delegates to service layer
 */

const weightSettingsService = require('../services/weightSettingsService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHandler');

/**
 * @route   GET /api/weight-settings
 * @desc    Get weight settings
 * @access  Private
 */
exports.getWeightSettings = asyncHandler(async (req, res) => {
  const settings = await weightSettingsService.getWeightSettings();
  sendSuccess(res, settings);
});

/**
 * @route   PUT /api/weight-settings
 * @desc    Update weight settings
 * @access  Private (Admin)
 */
exports.updateWeightSettings = asyncHandler(async (req, res) => {
  const { defaultWeightLimit, extraKgCost, villageDeliveryCost } = req.body;
  
  const updatedSettings = await weightSettingsService.updateWeightSettings(
    defaultWeightLimit,
    extraKgCost,
    villageDeliveryCost
  );
  
  sendSuccess(res, updatedSettings, 'تم تحديث إعدادات الوزن بنجاح');
});
