// src/store/socketStore.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../api/fetcher';
import { getToken } from '../utils/auth';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  initSocket: () => void;
  disconnectSocket: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  isConnected: false,

  initSocket: () => {
    const token = getToken();
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      set({ isConnected: true });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (err) => {
      console.error('⚠️ Socket connect error:', err.message);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    set((state) => {
      if (state.socket && state.socket.connected) {
        state.socket.disconnect();
        console.log('🔌 Socket manually disconnected');
      }
      return { socket: null, isConnected: false };
    });
  },
}));
