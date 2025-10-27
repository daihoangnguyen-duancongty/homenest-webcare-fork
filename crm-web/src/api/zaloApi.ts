import axios from 'axios';
import type { Message, User } from '../types';
import { getToken } from '../utils/auth';
import { BACKEND_URL } from './fetcher';

export const BASE_URL = import.meta.env.VITE_BACKEND_URL || `${BACKEND_URL}/api/zalo`;

// 📨 Lấy toàn bộ tin nhắn của 1 user
export const fetchMessages = async (
  userId: string,
  role: 'admin' | 'telesale',
  telesaleId?: string
): Promise<Message[]> => {
  const token = getToken();
  const params = new URLSearchParams({ role });
  if (telesaleId) params.append('telesaleId', telesaleId);

  const res = await fetch(`${BASE_URL}/messages/${userId}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error('❌ fetchMessages failed:', res.status, await res.text());
    throw new Error('Không thể tải tin nhắn');
  }

  return res.json();
};

// 💬 Gửi tin nhắn
export const sendMessage = async (userId: string, text: string) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, text }),
  });

  if (!res.ok) {
    console.error('❌ sendMessage failed:', res.status, await res.text());
    throw new Error('Gửi tin nhắn thất bại');
  }

  return res.json();
};

// 📞 Telesale gọi cho khách hàng

export const fetchCallLink = async (userId: string): Promise<string> => {
  const token = getToken();
  if (!userId) throw new Error('userId không hợp lệ');
  try {
    const res = await axios.post<{ success: boolean; callLink: string }>(
      `${BACKEND_URL}/api/zalo/call/create`,
      { userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.success) {
      return res.data.callLink;
    } else {
      throw new Error('Không thể tạo link gọi Zalo');
    }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error('❌ fetchCallLink failed:', err.response?.data || err.message);
    } else {
      console.error('❌ fetchCallLink failed:', err);
    }
    throw new Error('Không thể tạo link gọi Zalo');
  }
};


// 👥 Lấy danh sách telesale (chỉ admin)
export const fetchTelesales = async (): Promise<User[]> => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/telesales`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error('❌ fetchTelesales failed:', res.status, await res.text());
    throw new Error('Không thể tải danh sách telesale');
  }

  return res.json();
};

// 🔄 Phân công telesale cho cuộc hội thoại

export const assignTelesale = async (userId: string, telesaleId: string) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/assign-conversation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, telesaleId }),
  });

  if (!res.ok) {
    console.error('❌ assignTelesale failed:', res.status, await res.text());
    throw new Error('Không thể chỉ định telesale');
  }

  return res.json();
};
