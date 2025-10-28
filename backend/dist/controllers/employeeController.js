"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployees = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getEmployees = async (_req, res) => {
    try {
        const employees = await User_1.default.find({}, '-password');
        res.json(employees);
    }
    catch (err) {
        console.error('❌ Lỗi getEmployees:', err);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách nhân viên' });
    }
};
exports.getEmployees = getEmployees;
const createEmployee = async (req, res) => {
    const { username, email, phone, address, password, role } = req.body;
    if (!username || !email || !phone || !address || !password) {
        res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        return;
    }
    try {
        const existing = await User_1.default.findOne({ email });
        if (existing) {
            res.status(400).json({ message: 'Email đã tồn tại' });
            return;
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const avatarUrl = req.file?.path || null; // ✅ Cloudinary trả về URL ảnh
        const newUser = new User_1.default({
            username,
            email,
            phone,
            address,
            password: hashed,
            role: role || 'telesale',
            avatar: avatarUrl ? { path: avatarUrl } : undefined, // ✅ thêm dòng này
        });
        await newUser.save();
        res.status(201).json({ message: 'Tạo nhân viên thành công', user: newUser });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi tạo nhân viên' });
    }
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { username, email, phone, address, password, role } = req.body;
    try {
        const user = await User_1.default.findById(id);
        if (!user) {
            res.status(404).json({ message: 'Nhân viên không tồn tại' });
            return;
        }
        if (username)
            user.username = username;
        if (email)
            user.email = email;
        if (phone)
            user.phone = phone;
        if (address)
            user.address = address;
        if (role)
            user.role = role;
        if (password) {
            user.password = await bcryptjs_1.default.hash(password, 10);
        }
        if (req.file) {
            user.avatar = { path: req.file.path }; // ✅ cập nhật URL Cloudinary nếu có file mới
        }
        await user.save();
        res.json({ message: 'Cập nhật nhân viên thành công', user });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật nhân viên' });
    }
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User_1.default.findById(id);
        if (!user) {
            res.status(404).json({ message: 'Nhân viên không tồn tại' });
            return;
        }
        await User_1.default.findByIdAndDelete(id);
        res.json({ message: 'Xóa nhân viên thành công' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi xóa nhân viên' });
    }
};
exports.deleteEmployee = deleteEmployee;
