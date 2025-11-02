import { io } from 'socket.io-client';
import { BACKEND_URL } from '@/config/fetchConfig';

// Socket kết nối backend
export const socket = io(BACKEND_URL, { transports: ['websocket'] });
