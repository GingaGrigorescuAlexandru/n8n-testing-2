/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Not Found middleware
 * Catches requests to undefined routes
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Global error handler middleware
 * Handles all errors passed to next()
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (in development)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate entry';
    details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Sequelize database errors
  if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = 'Database error';
    details = process.env.NODE_ENV !== 'production' ? err.message : null;
  }

  // Handle Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference. The referenced resource does not exist.';
  }

  // Handle JSON parse errors
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body.';
  }

  // Handle payload too large
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload is too large.';
  }

  // Build response
  const response = {
    success: false,
    message,
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  ApiError,
  notFound,
  errorHandler,
};
