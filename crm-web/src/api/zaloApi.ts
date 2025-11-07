import axios from 'axios';
import type { Message, User } from '../types';
import { getToken } from '../utils/auth';
import { BACKEND_URL } from './../config/fetchConfig';
import type { CallData } from '../types';

export const BASE_URL = `${import.meta.env.VITE_BACKEND_URL || BACKEND_URL}/api/zalo`;

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

export const fetchCallLink = async (userId: string): Promise<CallData> => {
  const token = getToken();
  if (!userId) throw new Error('userId không hợp lệ');

  try {
    const res = await axios.post<{
      success: boolean;
      callId: string;
      channelName: string;
      guestToken: string;
      telesaleToken: string;
      appId: string;
        guestAgoraId: string;      // thêm
  telesaleAgoraId: string;   // thêm
      message?: string;
    }>(
      `${BACKEND_URL}/api/zalo/call/create`,
      { guestId: userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data.success) {
      return {
        success: true,
        callId: res.data.callId,
        channelName: res.data.channelName,
        guestToken: res.data.guestToken,
        telesaleToken: res.data.telesaleToken,
          appId: res.data.appId,
  guestAgoraId: res.data.guestAgoraId,
       telesaleAgoraId: res.data.telesaleAgoraId,
      };
    } else {
      throw new Error(res.data.message || 'Không thể tạo link gọi Zalo');
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
// 🗑️ Xóa toàn bộ tin nhắn của 1 user
export const deleteUserMessages = async (userId: string) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/messages/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error('❌ deleteUserMessages failed:', res.status, await res.text());
    throw new Error('Không thể xóa tin nhắn');
  }

  return res.json();
};

// 📌 Đồng bộ nhãn (label) lên backend
export const updateGuestLabel = async (userId: string, label: string) => {
  const token = getToken();
  if (!userId) throw new Error('userId không hợp lệ');
  if (!label) throw new Error('label không được để trống');

  try {
    const res = await axios.patch<{ success: boolean; guest: any }>(
      `${BASE_URL}/guests/${userId}/label`,
      { label },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.data.success) return res.data.guest;
    throw new Error('Không thể cập nhật nhãn');
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error('❌ updateGuestLabel failed:', err.response?.data || err.message);
    } else {
      console.error('❌ updateGuestLabel failed:', err);
    }
    throw new Error('Cập nhật nhãn thất bại');
  }
};
// 🏷️ Lấy nhãn của khách từ db về
export const fetchGuestLabel = async (userId: string): Promise<string> => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/guests/${userId}/label`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error('❌ fetchGuestLabel failed:', res.status, await res.text());
    throw new Error('Không thể lấy nhãn của khách');
  }

  const data = await res.json();
  return data.label || '';
};
