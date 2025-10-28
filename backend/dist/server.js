"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 🔧 Loại bỏ khoảng trắng đầu/cuối cho toàn bộ biến môi trường
for (const key in process.env) {
    const value = process.env[key];
    if (typeof value === 'string') {
        process.env[key] = value.trim();
    }
}
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const ZaloGuestUser_1 = __importDefault(require("./models/ZaloGuestUser"));
// Import các connection riêng
const connection_1 = require("./database/connection");
// Import routes
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const zaloRoutes_1 = __importDefault(require("./routes/zaloRoutes"));
// Import models sử dụng đúng connection
const User_1 = __importDefault(require("./models/User"));
// Import routes Zalo V4 User Access Token
const express_session_1 = __importDefault(require("express-session"));
const zaloUserRoutes_1 = __importDefault(require("./routes/zaloUserRoutes"));
// -------------------- Khởi tạo Express app --------------------
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
// ✅ Đảm bảo thư mục uploads tồn tại (Render sẽ không tự tạo)
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadDir);
}
// Serve thư mục public cho Zalo verification
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Phục vụ file zalodomainverify.txt
app.get('/zalodomainverify.txt', (req, res) => {
    const filePath = path_1.default.join(__dirname, '../public/zalodomainverify.txt');
    console.log('Serving file from:', filePath);
    res.sendFile(filePath);
});
// -------------------- Middleware chung--------------------
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
//---------------------Session Middleware for routes Zalo V4 User Access Token------------
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'keyboard-cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}));
// -------------------- Routes sử dụng session----------------------------------------------------------------------------------------------
// Zalo V4 OAuth router
app.use('/api/zalo-user', zaloUserRoutes_1.default);
// -------------------- Static Files --------------------
app.use('/uploads', express_1.default.static(uploadDir));
// -------------------- API Routes --------------------
app.use('/api/products', productRoutes_1.default);
app.use('/api/users', authRoutes_1.default);
app.use('/api/users', cartRoutes_1.default);
app.use('/api/zalo', zaloRoutes_1.default);
// -------------------- Socket.IO Setup --------------------
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
exports.io = io;
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    // 🔹 Khai báo biến lưu user hiện tại
    let currentUserId = null;
    // Khi user tham gia
    socket.on('join', async (userId) => {
        currentUserId = userId; // ✅ Gán userId khi join
        socket.join(userId);
        console.log(`👥 ${socket.id} joined room ${userId}`);
        // Đánh dấu online
        await ZaloGuestUser_1.default.findByIdAndUpdate(userId, { isOnline: true });
        io.emit('user_online', { userId, isOnline: true });
    });
    // Khi user rời khỏi
    socket.on('leave', async (userId) => {
        socket.leave(userId);
        console.log(`👋 ${socket.id} left room ${userId}`);
        await ZaloGuestUser_1.default.findByIdAndUpdate(userId, { isOnline: false });
        io.emit('user_online', { userId, isOnline: false });
    });
    socket.on('disconnect', async () => {
        console.log('❌ Client disconnected:', socket.id);
        if (currentUserId) {
            await ZaloGuestUser_1.default.findByIdAndUpdate(currentUserId, { isOnline: false });
            io.emit('user_online', { userId: currentUserId, isOnline: false });
            console.log(`📴 ${currentUserId} set offline`);
        }
    });
});
// -------------------- Test Routes --------------------
app.get('/api/test-db', async (_req, res) => {
    try {
        // Sử dụng connection userDB
        const users = await User_1.default.find().exec();
        res.json({ success: true, count: users.length });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Server is running smoothly' });
});
app.get('/', (_req, res) => {
    res.send('🚀 Backend đang hoạt động tốt!!');
});
// -------------------- Start Server --------------------
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
// -------------------- MongoDB Connection Logs --------------------
connection_1.productDB.once('open', () => console.log('✅ productDB connected!'));
connection_1.userDB.once('open', () => console.log('✅ userDB connected!'));
connection_1.zaloMessageDB.once('open', () => console.log('✅ zaloMessageDB connected!'));
connection_1.productDB.on('error', (err) => console.error('❌ productDB error:', err));
connection_1.userDB.on('error', (err) => console.error('❌ userDB error:', err));
connection_1.zaloMessageDB.on('error', (err) => console.error('❌ zaloMessageDB error:', err));
