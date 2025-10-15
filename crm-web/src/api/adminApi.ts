import type { Conversation } from '../types';
import { getToken } from '../utils/auth';
import { BACKEND_URL } from './fetcher';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || `${BACKEND_URL}/api/zalo`;

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
