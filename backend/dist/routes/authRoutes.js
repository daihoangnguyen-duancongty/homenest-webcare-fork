"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authenticateJWT_1 = require("../middleware/authenticateJWT");
const authorizeRole_1 = require("../middleware/authorizeRole");
const employeeController_1 = require("../controllers/employeeController");
const User_1 = __importDefault(require("../models/User"));
const uploadCloud_1 = __importDefault(require("../middleware/uploadCloud"));
const router = (0, express_1.Router)();
// ✅ Route đăng ký (có upload avatar)
router.post('/register', uploadCloud_1.default.single('avatar'), authController_1.register);
// ✅ Route đăng nhập
router.post('/login', authController_1.login);
// ✅ Admin Dashboard
router.get('/admin-dashboard', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeAdmin, (req, res) => {
    res.json({ message: 'Chào mừng bạn đến với trang quản trị' });
});
// ✅ Telesale Dashboard
router.get('/telesale-dashboard', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeTelesale, (req, res) => {
    res.json({ message: 'Chào mừng bạn đến với trang telesale' });
});
// ✅ Dashboard chung
router.get('/dashboard', authenticateJWT_1.authenticateToken, (0, authorizeRole_1.authorizeRoles)(['admin', 'telesale']), (req, res) => {
    res.json({ message: 'Chào mừng bạn đến với dashboard CRM' });
});
// ✅ Lấy danh sách nhân viên (telesales)
router.get('/employees', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeAdmin, employeeController_1.getEmployees);
// ✅ Lấy  nhân viên (telesales) theo ID
router.get('/:id', authenticateJWT_1.authenticateToken, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id).lean();
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ✅ Tạo nhân viên mới
router.post('/employees', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeAdmin, uploadCloud_1.default.single('avatar'), employeeController_1.createEmployee);
// ✅ Cập nhật nhân viên
router.put('/employees/:id', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeAdmin, uploadCloud_1.default.single('avatar'), employeeController_1.updateEmployee);
// ✅ Xóa nhân viên
router.delete('/employees/:id', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeAdmin, employeeController_1.deleteEmployee);
exports.default = router;
