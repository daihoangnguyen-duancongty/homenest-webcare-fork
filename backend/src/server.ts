import dotenv from 'dotenv';
dotenv.config();
//
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
import zaloGuestRoutes from './routes/zaloGuestRoutes';
import stringeeRoutes from "./routes/stringeeRoutes";
import stringeeWebhook from "./routes/stringeeWebhook";
// Import models sử dụng đúng connection
import UserModel from './models/User';
// Import routes Zalo V4 User Access Token
import session from 'express-session';
import zaloUserRoutes from './routes/zaloUserRoutes';
//
// import admin from "firebase-admin";
// import serviceAccount from "../serviceAccount.json";

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount as any),
// });
// -------------------- Khởi tạo Express app --------------------
const app = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);
// ✅ Đảm bảo thư mục uploads tồn tại (Render sẽ không tự tạo)
import fs from 'fs';

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadDir);
}
// Serve thư mục public cho Zalo verification
app.use(express.static(path.join(__dirname, '../public')));

// Phục vụ file zalodomainverify.txt
app.get('/zalodomainverify.txt', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, '../public/zalodomainverify.txt');
  console.log('Serving file from:', filePath);
  res.sendFile(filePath);
});

// -------------------- Middleware chung--------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//---------------------Session Middleware for routes Zalo V4 User Access Token------------

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard-cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// -------------------- Routes sử dụng session----------------------------------------------------------------------------------------------

// Zalo V4 OAuth router
app.use('/api/zalo-user', zaloUserRoutes);

// -------------------- Static Files --------------------
app.use('/uploads', express.static(uploadDir));

// -------------------- API Routes --------------------
app.use('/api/products', productRoutes);
app.use('/api/users', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/zalo', zaloRoutes);
app.use('/api/zalo', zaloGuestRoutes);
app.use("/api/stringee", stringeeRoutes);
app.use("/api/stringee", stringeeWebhook);
// -------------------- Socket.IO Setup --------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  // 🔹 Khai báo biến lưu user hiện tại
  let currentUserId: string | null = null;
  // Khi user tham gia
  socket.on('join', async (userId: string) => {
    currentUserId = userId; // ✅ Gán userId khi join
    socket.join(userId);
    console.log(`👥 ${socket.id} joined room ${userId}`);

    // Đánh dấu online
    await GuestUser.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user_online', { userId, isOnline: true });
  });

  // Khi user rời khỏi
  socket.on('leave', async (userId: string) => {
    socket.leave(userId);
    console.log(`👋 ${socket.id} left room ${userId}`);
    await GuestUser.findByIdAndUpdate(userId, { isOnline: false });
    io.emit('user_online', { userId, isOnline: false });
  });

  socket.on('disconnect', async () => {
    console.log('❌ Client disconnected:', socket.id);

    if (currentUserId) {
      await GuestUser.findByIdAndUpdate(currentUserId, { isOnline: false });
      io.emit('user_online', { userId: currentUserId, isOnline: false });
      console.log(`📴 ${currentUserId} set offline`);
    }
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
