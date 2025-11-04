import type { Conversation, GuestUser } from '../types';
import { getToken } from '../utils/auth';
import { BACKEND_URL } from './../config/fetchConfig';

const BASE_URL = `${BACKEND_URL}/api/zalo`;

// lấy danh sách cuộc trò chuyện
export const fetchConversations = async (): Promise<Conversation[]> => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error('❌ fetchConversations failed:', res.status, await res.text());
    throw new Error('Cannot fetch conversations');
  }
  return res.json();
};
// lấy danh sách khách hàng
export const fetchGuestUsers = async (): Promise<GuestUser[]> => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/guest-users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Cannot fetch guest users');
  const data = await res.json();

  return data.map((u: any) => ({
    ...u,
    userId: u._id,
  }));
};
