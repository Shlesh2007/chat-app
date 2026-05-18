export function errorHandler(err, req, res, next) {
  // Razorpay SDK throws plain objects, not Error instances
  const message = err.message || (typeof err.error === 'string' ? err.error : JSON.stringify(err.error)) || 'Internal Server Error';
  const status = err.status || err.statusCode || err.status_code || 500;

  console.error('Error:', message);
  if (err.stack) console.error('Stack:', err.stack);
  else console.error('Raw error:', JSON.stringify(err));

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && err.stack && { stack: err.stack }),
  });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
