/**
 * Validation Utility Functions
 * Provides reusable validation logic
 */

const { ValidationError } = require('./errors');

/**
 * Validate required fields
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new ValidationError(`حقول مطلوبة مفقودة: ${missingFields.join(', ')}`);
  }

  return true;
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('البريد الإلكتروني غير صحيح');
  }
  return true;
};

/**
 * Validate phone number (Egyptian format)
 */
const validatePhone = (phone) => {
  const phoneRegex = /^(01)[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('رقم الهاتف غير صحيح');
  }
  return true;
};

/**
 * Validate enum value
 */
const validateEnum = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `قيمة ${fieldName} غير صحيحة. القيم المسموحة: ${allowedValues.join(', ')}`
    );
  }
  return true;
};

/**
 * Validate positive number
 */
const validatePositiveNumber = (value, fieldName) => {
  if (typeof value !== 'number' || value < 0) {
    throw new ValidationError(`${fieldName} يجب أن يكون رقماً موجباً`);
  }
  return true;
};

/**
 * Validate ObjectId format
 */
const validateObjectId = (id, fieldName = 'المعرف') => {
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError(`${fieldName} غير صحيح`);
  }
  return true;
};

/**
 * Sanitize search query
 */
const sanitizeSearchQuery = (query) => {
  if (!query) return null;
  // Remove special regex characters to prevent regex injection
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
};

module.exports = {
  validateRequiredFields,
  validateEmail,
  validatePhone,
  validateEnum,
  validatePositiveNumber,
  validateObjectId,
  sanitizeSearchQuery,
};
