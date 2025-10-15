"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeTelesale = exports.authorizeCustomer = exports.authorizeAdmin = void 0;
// Middleware kiểm tra phân quyền cho admin
const authorizeAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        res.status(403).json({ message: 'Quyền truy cập bị từ chối. Cần quyền admin.' });
        return;
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
// Middleware kiểm tra phân quyền cho customer
const authorizeCustomer = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'customer') {
        res.status(403).json({ message: 'Quyền truy cập bị từ chối. Cần quyền customer.' });
        return;
    }
    next();
};
exports.authorizeCustomer = authorizeCustomer;
// Middleware kiểm tra phân quyền cho telesale
const authorizeTelesale = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'telesale') {
        res.status(403).json({ message: 'Quyền truy cập bị từ chối. Cần quyền telesale.' });
        return;
    }
    next();
};
exports.authorizeTelesale = authorizeTelesale;
