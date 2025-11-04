import { BACKEND_URL } from '@/config/fetchConfig';

// Dùng BACKEND_URL trong các API call
export const apiGet = async (endpoint: string) => {
  const res = await fetch(`${BACKEND_URL}${endpoint}`);
  return res.json();
};
