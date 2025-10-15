import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, User } from '../types';
import { fetchMessages, sendMessage, assignTelesale, fetchTelesales } from '../api/zaloApi';

let socket: Socket;

export function useChat(userId: string, role: 'admin' | 'telesale', telesaleId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [telesales, setTelesales] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = async () => {
    const data = await fetchMessages(userId, role, telesaleId);
    setMessages(data);
  };

  const loadTelesales = async () => {
    if (role === 'admin') {
      const data = await fetchTelesales();
      setTelesales(data);
    }
  };

  useEffect(() => {
    if (!socket) socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

    loadMessages();
    loadTelesales();

    const roomId = role === 'telesale' ? telesaleId : userId;
    socket.emit('join', roomId);

    socket.on('new_message', (msg: Message) => {
      if (role === 'admin' || (role === 'telesale' && msg.assignedTelesale === telesaleId)) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [userId, role, telesaleId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return {
    messages,
    telesales,
    messagesEndRef,
    loadMessages,
    loadTelesales,
    sendMessage,
    assignTelesale,
  };
}
