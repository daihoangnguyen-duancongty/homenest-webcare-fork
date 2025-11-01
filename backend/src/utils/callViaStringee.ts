import axios from "axios";

export async function callViaStringee(fromId: string, toId: string, token: string) {
  try {
    console.log(`📡 Calling Stringee: from=${fromId}, to=${toId}`);
    const response = await axios.post(
      "https://api.stringee.com/v1/call2/callout",
      {
        from: { type: "internal", number: fromId },
        to: [{ type: "internal", number: toId }],
        audio: true, // chỉ gọi audio
      },
      {
        headers: {
          "X-STRINGEE-AUTH": token,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📞 callViaStringee response:", response.data);
    return response.data;
  } catch (err: any) {
    console.error("❌ callViaStringee error:", err.response?.data || err.message);
    throw err;
  }
}
