import dotenv from 'dotenv';
dotenv.config();
// 🔧 Loại bỏ khoảng trắng đầu/cuối cho toàn bộ biến môi trường
for (const key in process.env) {
  const value = process.env[key];
  if (typeof value === 'string') {
    process.env[key] = value.trim();
  }
}
console.log('ZALO_REFRESH_TOKEN=', process.env.ZALO_REFRESH_TOKEN);
console.log('ZALO_REFRESH_TOKEN trimmed:', process.env.ZALO_REFRESH_TOKEN?.trim());
console.log('MONGO_URI:', `"${process.env.MONGO_URI}"`);
console.log('ZALO_REFRESH_TOKEN:', `"${process.env.ZALO_REFRESH_TOKEN}"`);
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import GuestUser from './models/ZaloGuestUser';
// Import các connection riêng
import { productDB, userDB, zaloMessageDB } from './database/connection';

// Import routes
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import cartRoutes from './routes/cartRoutes';
import zaloRoutes from './routes/zaloRoutes';

// Import models sử dụng đúng connection
import UserModel from './models/User';

// -------------------- Khởi tạo Express app --------------------
const app = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Serve thư mục public cho Zalo verification
app.use(express.static(path.join(__dirname, '../public')));

// Phục vụ file zalodomainverify.txt
app.get('/zalodomainverify.txt', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, '../public/zalodomainverify.txt');
  console.log('Serving file from:', filePath);
  res.sendFile(filePath);
});

// -------------------- Middleware --------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- Static Files --------------------
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// -------------------- API Routes --------------------
app.use('/api/products', productRoutes);
app.use('/api/users', authRoutes);
app.use('/api/users', cartRoutes);
app.use('/api/zalo', zaloRoutes);

// -------------------- Socket.IO Setup --------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join', async (userId: string) => {
    socket.join(userId);
    console.log(`👥 ${socket.id} joined room ${userId}`);

    // đánh dấu online
    await GuestUser.findByIdAndUpdate(userId, { isOnline: true });
    // emit trạng thái mới
    io.emit('user_online', { userId, isOnline: true });
  });

  socket.on('disconnect', async () => {
    console.log('❌ Client disconnected:', socket.id);

    // có thể lấy userId từ rooms để update offline
    // hoặc frontend emit "leave"
  });
});

// ✅ Export io để các file khác emit real-time
export { io };

// -------------------- Test Routes --------------------
app.get('/api/test-db', async (_req, res) => {
  try {
    // Sử dụng connection userDB
    const users = await UserModel.find().exec();
    res.json({ success: true, count: users.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running smoothly' });
});

app.get('/', (_req: Request, res: Response) => {
  res.send('🚀 Backend đang hoạt động tốt!!');
});

// -------------------- Start Server --------------------
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// -------------------- MongoDB Connection Logs --------------------
productDB.once('open', () => console.log('✅ productDB connected!'));
userDB.once('open', () => console.log('✅ userDB connected!'));
zaloMessageDB.once('open', () => console.log('✅ zaloMessageDB connected!'));

productDB.on('error', (err) => console.error('❌ productDB error:', err));
userDB.on('error', (err) => console.error('❌ userDB error:', err));
zaloMessageDB.on('error', (err) => console.error('❌ zaloMessageDB error:', err));
