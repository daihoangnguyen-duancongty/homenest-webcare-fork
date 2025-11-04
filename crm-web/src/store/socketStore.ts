import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from './../config/fetchConfig';
import { getToken } from '../utils/auth';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  initSocket: () => void;
  disconnectSocket: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,

  initSocket: () => {
    const token = getToken();
    if (!token) {
      console.warn('⚠️ No token, skip socket init');
      return;
    }

    // Nếu đang có socket rồi hoặc đang connecting thì bỏ qua
    if (get().socket || get().isConnecting) return;

    set({ isConnecting: true });

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000, // ⏰ timeout 10s
    });

    // Kết nối thành công
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      set({ isConnected: true, isConnecting: false });
    });

    // Lỗi kết nối
    socket.on('connect_error', (err) => {
      console.error('🚫 Socket connect error:', err.message);
      set({ isConnected: false, isConnecting: false });
    });

    // Ngắt kết nối
    socket.on('disconnect', (reason) => {
      console.warn('🔌 Socket disconnected:', reason);
      set({ isConnected: false });
      // Reconnect nhẹ sau 3s nếu mất kết nối do timeout
      if (reason === 'ping timeout' || reason === 'transport close') {
        setTimeout(() => {
          console.log('♻️ Retrying socket connection...');
          get().initSocket();
        }, 3000);
      }
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      console.log('🔴 Socket manually disconnected');
    }
    set({ socket: null, isConnected: false, isConnecting: false });
  },
}));
