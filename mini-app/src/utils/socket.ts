import { io } from 'socket.io-client';
import { BACKEND_URL } from '@/config/fetchConfig';

// Socket kết nối backend
export const socket = io(BACKEND_URL, { transports: ['websocket'] });

// Log connection
socket.on('connect', () => setDebugLog((prev) => [...prev, `✅ Socket connected, id: ${socket.id}`]));
socket.on('connect_error', (err) => setDebugLog((prev) => [...prev, `❌ Socket connect_error: ${err}`]));
socket.on('disconnect', (reason) => setDebugLog((prev) => [...prev, `⚠️ Socket disconnected: ${reason}`]));
