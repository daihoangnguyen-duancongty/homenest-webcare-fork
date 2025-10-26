// server.ts
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes';
// ...import các routes khác nếu cần

// -------------------- Tạo thư mục uploads --------------------
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 uploads directory created');
}

// -------------------- Khởi tạo Express app --------------------
const app = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// -------------------- Middleware --------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file tĩnh từ uploads
app.use('/uploads', express.static(uploadDir));

// -------------------- API Routes --------------------
app.use('/api/users', authRoutes);
// ... các route khác

// -------------------- Socket.IO Setup --------------------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id));
});

// -------------------- Start Server --------------------
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
