import axios from 'axios';

export async function getUserProfileV4(userAccessToken: string) {
  try {
    const res = await axios.get('https://openapi.zalo.me/v4.0/me', {
      headers: { Authorization: `Bearer ${userAccessToken}` },
    });
    return res.data; // name, avatar, phone, email, birthday,...
  } catch (err) {
    console.error('❌ Failed fetch user profile V4:', err);
    return null;
  }
}
