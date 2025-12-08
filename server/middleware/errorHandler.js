/**
 * Global Error Handling Middleware
 * Catches all errors and returns consistent error responses
 */

const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../constants');

const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('❌ ERROR:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle operational errors (known errors)
  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode, err.errorCode);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return sendError(res, message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR');
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `هذا ${field} موجود بالفعل`;
    return sendError(res, message, HTTP_STATUS.CONFLICT, 'DUPLICATE_KEY');
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `معرف غير صحيح: ${err.value}`;
    return sendError(res, message, HTTP_STATUS.BAD_REQUEST, 'INVALID_ID');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'رمز التوثيق غير صحيح', HTTP_STATUS.UNAUTHORIZED, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'انتهت صلاحية رمز التوثيق', HTTP_STATUS.UNAUTHORIZED, 'EXPIRED_TOKEN');
  }

  // Default error response (unexpected errors)
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'حدث خطأ في الخادم';
    
  return sendError(
    res,
    message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    'INTERNAL_SERVER_ERROR'
  );
};

module.exports = errorHandler;
