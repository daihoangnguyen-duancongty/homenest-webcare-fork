import { io } from 'socket.io-client';
import { BACKEND_URL } from '@/config/fetchConfig';

// Callback debug log do component truyền vào
let debugCallback: ((msg: string) => void) | null = null;

export const setDebugCallback = (cb: (msg: string) => void) => {
  debugCallback = cb;
};

// Socket kết nối backend
export const socket = io(BACKEND_URL, { transports: ['websocket'] });

// Log connection thông qua callback (hoặc console nếu chưa set)
socket.on('connect', () => debugCallback?.(`✅ Socket connected, id: ${socket.id}`) ?? console.log(`✅ Socket connected, id: ${socket.id}`));
socket.on('connect_error', (err) => debugCallback?.(`❌ Socket connect_error: ${err}`) ?? console.log(`❌ Socket connect_error: ${err}`));
socket.on('disconnect', (reason) => debugCallback?.(`⚠️ Socket disconnected: ${reason}`) ?? console.log(`⚠️ Socket disconnected: ${reason}`));
