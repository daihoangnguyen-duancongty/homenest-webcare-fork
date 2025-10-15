import { getUserInfo } from 'zmp-sdk';

export async function fetchZaloUserId(): Promise<string | null> {
  try {
    const res = await getUserInfo();
    const id = res.userInfo?.id;
    console.log('👤 Zalo user_id:', id);
    return id || null;
  } catch (err) {
    console.error('⚠️ Không lấy được user_id từ Zalo:', err);
    return null;
  }
}
