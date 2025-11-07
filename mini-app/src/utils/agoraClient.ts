import AgoraRTC from "agora-rtc-sdk-ng";

// 🔹 Giữ client duy nhất cho toàn app
export const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
