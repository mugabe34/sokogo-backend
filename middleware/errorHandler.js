// Comprehensive Error Handling Middleware for Sokogo Backend

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error Details:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
    }

    // CORS errors
    if (err.message && err.message.includes('CORS')) {
        const message = 'CORS policy violation';
        error = { message, statusCode: 403 };
    }

    // Rate limiting errors
    if (err.status === 429) {
        const message = 'Too many requests, please try again later';
        error = { message, statusCode: 429 };
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File too large';
        error = { message, statusCode: 400 };
    }

    // Database connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
        const message = 'Database connection error';
        error = { message, statusCode: 503 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            originalError: err 
        })
    });
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFound = (req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    next(error);
};

// Validation error handler
const validationError = (errors) => {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    return error;
};

module.exports = {
    errorHandler,
    asyncHandler,
    notFound,
    validationError
};
