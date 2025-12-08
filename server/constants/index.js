/**
 * Application Constants
 * Central location for all magic numbers and strings
 */

// User Types
const USER_TYPES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  MERCHANT: 'merchant',
  COURIER: 'courier',
};

// Order Statuses
const ORDER_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  ON_THE_WAY: 'On the Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

// Order Types
const ORDER_TYPES = {
  DELIVERY: 'delivery',
  RETURN: 'return',
  EXCHANGE: 'exchange',
};

// Payment Types
const PAYMENT_TYPES = {
  CASH_ON_DELIVERY: 'cash_on_delivery',
  PREPAID: 'prepaid',
};

// Driver Status
const DRIVER_STATUS = {
  PENDING: 'pending',
  PICKED_UP: 'picked-up',
  IN_TRANSIT: 'in-transit',
  DELIVERED: 'delivered',
};

// State Transition Rules
const STATE_TRANSITION_RULES = {
  [USER_TYPES.ADMIN]: {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.PENDING, ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.ON_THE_WAY]: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CANCELLED]: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.DELIVERED],
  },
  [USER_TYPES.EMPLOYEE]: {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.PENDING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.ON_THE_WAY]: [],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
  },
  [USER_TYPES.MERCHANT]: {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.ON_THE_WAY]: [],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
  },
  [USER_TYPES.COURIER]: {
    [ORDER_STATUS.PENDING]: [],
    [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.ON_THE_WAY]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
  },
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Error Messages (Arabic)
const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  UNAUTHORIZED_USER_TYPE: 'نوع المستخدم غير مصرح له بالوصول إلى لوحة التحكم',
  EMAIL_PASSWORD_REQUIRED: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
  
  // Users
  USER_NOT_FOUND: 'المستخدم غير موجود',
  MERCHANT_NOT_FOUND: 'التاجر المختار غير موجود',
  INVALID_MERCHANT: 'المستخدم المختار ليس تاجرًا',
  DRIVER_NOT_FOUND: 'السائق غير موجود',
  USER_NOT_COURIER: 'المستخدم ليس سائقًا',
  
  // Orders
  ORDER_NOT_FOUND: 'الطلب غير موجود',
  INVALID_STATUS: 'حالة غير صحيحة',
  REQUIRED_FIELD_MISSING: 'حقل مطلوب مفقود',
  
  // Locations
  GOVERNORATE_NOT_FOUND: 'المحافظة غير موجودة',
  CITY_NOT_FOUND: 'المدينة غير موجودة',
  CITY_INACTIVE: 'المدينة المحددة غير مفعلة',
  GOVERNORATE_NAME_CODE_REQUIRED: 'اسم ورمز المحافظة مطلوبان',
  GOVERNORATE_DUPLICATE: 'اسم أو رمز المحافظة موجود بالفعل',
  CITY_NAME_GOVERNORATE_REQUIRED: 'اسم المدينة ومعرف المحافظة مطلوبان',
  CITY_DUPLICATE: 'المدينة موجودة بالفعل في هذه المحافظة',
  GOVERNORATE_HAS_CITIES: 'لا يمكن حذف المحافظة. يوجد مدن مرتبطة بها',
  
  // Shipping
  WEIGHT_SETTINGS_NOT_FOUND: 'إعدادات الوزن غير مضبوطة',
  SHIPPING_TYPE_NOT_FOUND: 'نوع الشحن غير صحيح',
  SHIPPING_TYPE_INACTIVE: 'نوع الشحن المحدد غير مفعل',
  
  // Generic
  SERVER_ERROR: 'خطأ في الخادم',
  VALIDATION_ERROR: 'خطأ في التحقق من البيانات',
};

// Success Messages (Arabic)
const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح',
  ORDER_CREATED: 'تم إنشاء الطلب بنجاح',
  ORDER_UPDATED: 'تم تحديث الطلب بنجاح',
  ORDER_DELETED: 'تم حذف الطلب بنجاح',
  STATUS_UPDATED: 'تم تحديث الحالة بنجاح',
  USER_ADDED: 'تم إضافة المستخدم بنجاح',
  USER_UPDATED: 'تم تحديث المستخدم بنجاح',
  USER_DELETED: 'تم حذف المستخدم بنجاح',
  PASSWORD_UPDATED: 'تم تحديث كلمة المرور بنجاح',
  CITIES_ASSIGNED: 'تم تعيين المدن بنجاح',
  GOVERNORATE_ADDED: 'تم إضافة المحافظة بنجاح',
  GOVERNORATE_UPDATED: 'تم تحديث المحافظة بنجاح',
  GOVERNORATE_DELETED: 'تم حذف المحافظة بنجاح',
  CITY_ADDED: 'تم إضافة المدينة بنجاح',
  CITY_UPDATED: 'تم تحديث المدينة بنجاح',
  CITY_DELETED: 'تم حذف المدينة بنجاح',
};

module.exports = {
  USER_TYPES,
  ORDER_STATUS,
  ORDER_TYPES,
  PAYMENT_TYPES,
  DRIVER_STATUS,
  STATE_TRANSITION_RULES,
  HTTP_STATUS,
  PAGINATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
