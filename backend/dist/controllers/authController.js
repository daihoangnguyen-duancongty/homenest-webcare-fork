"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../database/connection");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined.');
}
// ===================== ĐĂNG KÝ =====================
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const email = (_a = req.body.email) === null || _a === void 0 ? void 0 : _a.trim();
        const password = (_b = req.body.passWord) === null || _b === void 0 ? void 0 : _b.trim();
        const confirmpassword = (_c = req.body.confirmPassWord) === null || _c === void 0 ? void 0 : _c.trim();
        const username = (_d = req.body.userName) === null || _d === void 0 ? void 0 : _d.trim();
        const phone = (_e = req.body.phone) === null || _e === void 0 ? void 0 : _e.trim();
        const address = (_f = req.body.address) === null || _f === void 0 ? void 0 : _f.trim();
        const role = ((_g = req.body.role) === null || _g === void 0 ? void 0 : _g.trim()) || 'user';
        const avatar = req.file;
        console.log('📨 Request đăng ký:', req.body);
        if (!email || !password || !confirmpassword || !username || !phone || !address || !avatar) {
            res.status(400).json({ message: 'Thiếu thông tin đăng ký.' });
            return;
        }
        if (password !== confirmpassword) {
            res.status(400).json({ message: 'Mật khẩu xác nhận không khớp.' });
            return;
        }
        // Kiểm tra trùng email
        const existing = yield connection_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(400).json({ message: 'Email đã tồn tại.' });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield connection_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
                phone,
                address,
                role,
                avatar: {
                    path: avatar.path,
                    filename: avatar.filename,
                    originalname: avatar.originalname,
                },
            },
        });
        res.status(201).json({ message: 'Đăng ký thành công.', userId: newUser.id });
    }
    catch (err) {
        console.error('❌ Register Error:', err);
        res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
    }
});
exports.register = register;
// ===================== ĐĂNG NHẬP =====================
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Thiếu email hoặc mật khẩu.' });
            return;
        }
        const user = yield connection_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Email không tồn tại.' });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Mật khẩu không đúng.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Đăng nhập thành công.',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                phone: user.phone,
                address: user.address,
                avatar: user.avatar,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error('❌ Login Error:', err);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
    }
});
exports.login = login;
