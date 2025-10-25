import type { Message } from './index'; // hoặc đúng path tới Message

export interface UserOnlinePayload {
  userId: string;
  isOnline: boolean;
}

export interface NewMessagePayload {
  userId: string;
  message: Message;
  lastInteraction: string;
}
