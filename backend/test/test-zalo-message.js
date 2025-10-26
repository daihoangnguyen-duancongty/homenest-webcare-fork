import axios from 'axios';

const ACCESS_TOKEN = 'c2DaQNDSFpYQAMLjS5mnFf0fQcfyGJn_pqWQHY1fB12CO2OI7LzrFenhHGeoHnLQf4eRM0nxBsgiNdjuM51GAjbQKtuvNdXhg2vBUpzVPo-4RdSY2d1QA8Tw00mwK20rhs8wOGDK25UW8JjG4G4CUAek0L4L7Yj8lY1mIILNAqJCKZiGP78MNkvVFt00KXadx7qQ3t9AFWV2QH47McGr1lfA9IrIFdCAiW5G2oq0Tng6F6Gk72jLT846U5rlArbfxXLNPMCXUs7K3qf8M2SPP-yJ4t4FFo4hiW0G4G0qBKVW7IfEG6b_USX8KYiYV48SkdzcAZ5HAHx59X9BJGKXGz1w9srJTGDD_qeMJ7HDGbZcPqa8I5KIEUXwA09eNNnCvMnm77OJGIxi7ta1GmaY1zmW5rGm1117UJRPHc9ZTKitFG // token bạn đã có
const USER_ID = '424242424242424242'; // user id thật từ webhook Zalo gửi về

(async () => {
  try {
    const res = await axios.post(
      'https://openapi.zalo.me/v3.0/oa/message/cs',
      {
        recipient: { user_id: USER_ID },
        message: { text: '👋 Xin chào, đây là tin nhắn test từ OA!' },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          access_token: ACCESS_TOKEN,
        },
      }
    );

    console.log('✅ Kết quả:', res.data);
  } catch (err) {
    console.error('❌ Lỗi:', err.response?.data || err.message);
  }
})();
