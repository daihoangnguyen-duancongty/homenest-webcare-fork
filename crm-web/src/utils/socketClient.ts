// src/socket/socketClient.ts
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../api/zaloApi';
import { getToken } from '../utils/auth';

let socket: Socket | null = null;

/**
 * Hàm khởi tạo socket client (chỉ nên gọi 1 lần ở app)
 */
export const initSocket = () => {
  if (!socket) {
    const token = getToken();
    socket = io(BASE_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });
  }
  return socket;
};

/**
 * Lấy socket instance
 */
export const getSocket = () => socket;

/**
 * Đăng ký lắng nghe sự kiện realtime
 */
export const subscribeRealtimeEvents = ({
  onUserOnline,
  onNewMessage,
}: {
  onUserOnline?: (data: { userId: string; isOnline: boolean }) => void;
  onNewMessage?: (data: { userId: string; message: any }) => void;
}) => {
  if (!socket) return;

  if (onUserOnline) {
    socket.on('user_online', onUserOnline);
  }

  if (onNewMessage) {
    socket.on('new_message', onNewMessage);
  }
};

/**
 * Huỷ đăng ký khi unmount
 */
export const unsubscribeRealtimeEvents = () => {
  if (!socket) return;
  socket.off('user_online');
  socket.off('new_message');
};
