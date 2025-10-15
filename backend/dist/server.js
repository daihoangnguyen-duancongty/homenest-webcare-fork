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
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const connection_1 = require("./database/connection");
// Import routes
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const zaloRoutes_1 = __importDefault(require("./routes/zaloRoutes"));
// Khởi tạo Express app
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
// serve static files trong thư mục public
// Phục vụ file zalodomainverify.txt
app.get('/zalodomainverify.txt', (req, res) => {
    const filePath = path_1.default.join(__dirname, '../public/zalodomainverify.txt');
    console.log('Serving file from:', filePath); // debug trên Render
    res.sendFile(filePath);
});
// -------------------- Middleware --------------------
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// -------------------- Static Files --------------------
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// -------------------- API Routes --------------------
app.use('/api/products', productRoutes_1.default);
app.use('/api/users', authRoutes_1.default);
app.use('/api/users', cartRoutes_1.default);
app.use('/api', zaloRoutes_1.default);
// -------------------- Socket.IO Setup --------------------
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // hoặc http://localhost:3000 nếu muốn giới hạn
    },
});
exports.io = io;
// Khi client kết nối
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    // Client join phòng theo userId
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`👥 ${socket.id} joined room ${userId}`);
    });
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});
// -------------------- Test Routes --------------------
app.get('/api/test-db', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield connection_1.prisma.user.findMany();
        res.json({ success: true, count: users.length });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}));
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running smoothly' });
});
app.get('/', (req, res) => {
    res.send('🚀 Backend đang hoạt động tốt!!');
});
// -------------------- Start Server --------------------
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
