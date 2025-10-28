"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authorizeTelesale = exports.authorizeAdmin = void 0;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
// 🔒 Chỉ cho phép Admin
const authorizeAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Quyền truy cập bị từ chối. Cần quyền admin.' });
        return; // chỉ return để dừng hàm, không trả về Response
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
// Chỉ telesale
const authorizeTelesale = (req, res, next) => {
    if (req.user?.role !== 'telesale') {
        res.status(403).json({ message: 'Quyền truy cập bị từ chối. Cần quyền telesale.' });
        return;
    }
    next();
};
exports.authorizeTelesale = authorizeTelesale;
// Cho phép nhiều role
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Quyền truy cập bị từ chối.' });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
