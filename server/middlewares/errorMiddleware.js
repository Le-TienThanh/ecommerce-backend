class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || 'Lỗi máy chủ nội bộ';
    err.statusCode = err.statusCode || 500;
    if (err.code === 11000) {
        const message = 'Giá trị trường trùng lặp đã được nhập';
        err = new ErrorHandler(message, 400);
    }
    if (err.name === 'JsonWebTokenError') {
        const message = 'JSON Web Token không hợp lệ, vui lòng thử lại';
        err = new ErrorHandler(message, 400);
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'JSON Web Token đã hết hạn, vui lòng thử lại';
        err = new ErrorHandler(message, 400);
    }
    const errorMessage = err.errors
        ? Object.values(err.errors)
              .map((error) => error.message)
              .join(' ')
        : err.message;
        console.error(err);
    return res.status(err.statusCode).json({
        success: false,
        message: errorMessage,
    })

};

export default ErrorHandler;
