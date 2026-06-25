/**
 * globalErrorHandler — catches all errors passed via next(err).
 * Returns { success: false, message, stack } (stack only in development).
 */
export const globalErrorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('>>> Unhandled error:', err.stack || err.message);

  const statusCode = err.status || err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
