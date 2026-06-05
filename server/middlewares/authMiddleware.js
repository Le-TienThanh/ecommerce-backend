import jwt from 'jsonwebtoken';
import { catchAsyncErrors } from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../middlewares/errorMiddleware.js';
import database from '../database/db.js';

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(
            new ErrorHandler('Vui lòng đăng nhập để truy cập tài nguyên này', 401),
        );
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await database.query('SELECT * FROM users WHERE id = $1', [
        decoded.id,
    ]);
    req.user = user.rows[0];
    

    next();
});

export const authorizedRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorHandler(
                    `Vai trò: ${req.user.role} không được phép truy cập tài nguyên này`,
                    403,
                ),
                
            );
        }
        next();
    };
};
