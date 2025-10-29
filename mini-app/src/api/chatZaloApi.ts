// src/api/chatApi.ts

import { BACKEND_URL } from "./fetcher";

export interface SendMessageResponse {
  success: boolean;
  result?: { replyText?: string };
  error?: string;
}

export const sendMessageAPI = async (
  userId: string,
  text: string
): Promise<SendMessageResponse> => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/zalo/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text }),
    });

    if (!res.ok) {
      const errData = await res.json();
      return { success: false, error: errData.error || 'Gửi tin nhắn thất bại' };
    }

    const data = await res.json();
    return { success: data.success, result: data.result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi mạng' };
  }
};
