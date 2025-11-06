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
export type UserWithOnline = User & { isOnline?: boolean };
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
export interface GuestUser {
  _id: string; // ID trong MongoDB
  userId: string;
  username: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
  lastInteraction?: string | Date;
  assignedTelesale?: string | null;
  guestAgoraId?: string;
  telesaleAgoraId?: string;
}
export interface CallData {
  success?: boolean;
  callId: string;
  channelName: string;
  guestToken: string;
  telesaleToken: string;
  appId: string;
  guestAgoraId?: string; // UID của guest
  telesaleAgoraId?: string; // UID của telesale
}
export interface InboundCallData {
  guestName?: string;
  callLink: string;
  targetRole?: string;
  targetUserId?: string;
}
