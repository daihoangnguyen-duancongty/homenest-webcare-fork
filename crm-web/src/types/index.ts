export interface Message {
  _id: string;
  userId: string;
  text: string;
  sentAt: string;
  success: boolean;
  response?: Record<string, unknown>; //  thay vì any
  assignedTelesale?: string | null;
  username?: string;
  from?: 'user' | 'admin' | 'telesale';
}

export interface User {
  id: string;
  email: string;
  username: string;
  phone: string;
  address: string;
  avatar?: string | null; //  hoặc kiểu file/base64 nếu có
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  assignedTelesale?: string;
  userId: string;
  name?: string;
  lastMessage: string;
}
