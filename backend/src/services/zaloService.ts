import axios from 'axios';
import { ZALO_CONFIG } from '../config/zalo';
import UserModel from '../models/User';
import { ZaloUserProfile } from '../type/zaloUserProfile';

let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

/**
 * Lấy Access Token mới bằng Refresh Token
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiry) return cachedAccessToken;

  const res = await axios.post('https://oauth.zaloapp.com/v4/oa/access_token', {
    app_id: ZALO_CONFIG.APP_ID,
    app_secret: ZALO_CONFIG.APP_SECRET,
    refresh_token: ZALO_CONFIG.REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const data = res.data as any;
  cachedAccessToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000; // refresh trước 60s

  console.log('✅ Access Token mới:', cachedAccessToken);
  return cachedAccessToken!;
}

/**
 * Gửi tin nhắn từ OA tới user
 */
export async function sendMessage(userId: string, text: string) {
  const token = await getAccessToken();
  const res = await axios.post(
    'https://openapi.zalo.me/v3.0/oa/message/cs',
    {
      recipient: { user_id: userId },
      message: { text },
    },
    {
      headers: {
        access_token: token,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = res.data as any;
  console.log(`📤 Đã gửi tin nhắn tới ${userId}:`, data);
  return data;
}

/**
 * Fetch thông tin profile người dùng từ Zalo và cập nhật DB
 */
export async function fetchZaloUserProfile(userId: string): Promise<ZaloUserProfile | null> {
  try {
    const token = await getAccessToken();
    const res = await axios.get(
      `https://openapi.zalo.me/v2.0/oa/getprofile?user_id=${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const profile = res.data as ZaloUserProfile;

    if (profile.error === 0) {
      // ✅ Upsert user MongoDB
      await UserModel.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            username: profile.name,
            avatar: profile.avatar,
          },
          $setOnInsert: {
            email: `${userId}@zalo.local`,
            password: 'zalo-auto',
            phone: userId,
            address: '',
          },
        },
        { upsert: true }
      );

      return profile;
    } else {
      console.warn(`⚠️ Lỗi fetch profile Zalo: ${profile.error}`);
      return null;
    }
  } catch (err) {
    console.error('❌ Failed to fetch Zalo user profile:', err);
    return null;
  }
}
