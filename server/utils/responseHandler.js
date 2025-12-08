/**
 * Standardized Response Handlers
 * Provides consistent API response format
 */

const { HTTP_STATUS } = require('../constants');

/**
 * Send success response
 */
const sendSuccess = (res, data = null, message = null, statusCode = HTTP_STATUS.OK, meta = null) => {
  const response = {
    status: 'success',
  };

  if (message) response.message = message;
  if (meta) response.meta = meta;
  if (data !== null) response.data = data;

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
const sendError = (res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = null) => {
  const response = {
    status: 'error',
    message,
  };

  if (errorCode) response.errorCode = errorCode;

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
const sendPaginatedResponse = (res, data, meta, message = null) => {
  const response = {
    status: 'success',
    results: data.length,
    meta,
    data,
  };

  if (message) response.message = message;

  return res.status(HTTP_STATUS.OK).json(response);
};

/**
 * Send created response
 */
const sendCreated = (res, data, message) => {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  sendCreated,
};
