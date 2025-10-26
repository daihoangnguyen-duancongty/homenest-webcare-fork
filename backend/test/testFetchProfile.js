const { fetchZaloUserProfile } = require('../src/services/zaloService');

(async () => {
  const userId = '5620597192786277377'; // Thay bằng userId muốn test
  try {
    const profile = await fetchZaloUserProfile(userId);
    console.log('✅ Zalo profile:', profile);
  } catch (err) {
    console.error('❌ Lỗi khi fetch profile:', err);
  }
})();
