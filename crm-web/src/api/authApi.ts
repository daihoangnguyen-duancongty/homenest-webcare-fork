import axios from 'axios';
import { BACKEND_URL } from './fetcher';

const API_URL = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api/users`;

// ========================
// Định nghĩa kiểu dữ liệu
// ========================

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  // thêm các trường khác nếu cần
}

export interface RegisterUserResponse {
  id: string;
  name: string;
  email: string;
  // các trường API trả về nếu có
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Telesales {
  id: string;
  name: string;
  // các trường khác nếu có
}

// ========================
// Hàm API
// ========================

export async function registerUser(data: RegisterUserData): Promise<RegisterUserResponse> {
  const res = await axios.post<RegisterUserResponse>(`${API_URL}/register`, data);
  return res.data;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>(`${API_URL}/login`, { email, password });
  return res.data;
}

export async function getTelesales(): Promise<Telesales[]> {
  const res = await axios.get<Telesales[]>(`${BACKEND_URL}/api/zalo/telesales`);
  return res.data;
}
