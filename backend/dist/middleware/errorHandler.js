"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.createError = createError;
function errorHandler(err, _req, res, _next) {
    console.error('[Error]', err.message, err.stack);
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal Server Error' : err.message;
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}
function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}
//# sourceMappingURL=errorHandler.js.map