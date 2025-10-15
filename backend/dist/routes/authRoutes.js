"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authenticateJWT_1 = require("../middleware/authenticateJWT");
const authorizeRole_1 = require("../middleware/authorizeRole");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// Cấu hình multer để xử lý file tải lên
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage });
// Đăng ký người dùng mới
router.post('/register', upload.single('avatar'), authController_1.register);
// Đăng nhập và trả về token + role
router.post('/login', authController_1.login);
// Dashboard admin (chỉ admin mới truy cập được)
router.get('/admin-dashboard', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeAdmin, (req, res) => {
    res.json({ message: 'Chào mừng bạn đến với trang quản trị' });
});
// Dashboard telesale (chỉ telesale mới truy cập được)
router.get('/telesale-dashboard', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeTelesale, (req, res) => {
    res.json({ message: 'Chào mừng bạn đến với trang telesale' });
});
// Dashboard customer
router.get('/customer-profile', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeCustomer, (req, res) => {
    res.json({ message: 'Chào mừng bạn đến với hồ sơ khách hàng' });
});
exports.default = router;
