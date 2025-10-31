// import admin from "firebase-admin";

// /**
//  * Gửi push notification tới FCM token của telesale
//  * @param fcmToken - token lấy từ app telesale khi đăng nhập
//  * @param guestName - tên hoặc zaloId của khách hàng
//  */
// export async function pushIncomingCall(fcmToken: string, guestName: string) {
//   try {
//     if (!admin.apps.length) {
//       const serviceAccount = require("../../serviceAccount.json");
//       admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount),
//       });
//     }

//     await admin.messaging().send({
//       token: fcmToken,
//       notification: {
//         title: "📞 Cuộc gọi đến",
//         body: `Khách hàng ${guestName} đang gọi bạn`,
//       },
//       data: {
//         type: "incoming_call",
//         guestName,
//       },
//     });

//     console.log(`✅ Đã gửi push FCM tới telesale: ${fcmToken.slice(0, 10)}...`);
//   } catch (err: any) {
//     console.error("❌ pushIncomingCall error:", err.message);
//   }
// }
