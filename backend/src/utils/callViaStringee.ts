import axios from "axios";

export async function callViaStringee(fromId: string, toId: string) {
  try {
    // Payload Stringee version chuẩn: from & to là string
    const payload = {
      from: fromId,
      to: toId,
      customField: "zalo_inbound",
    };

    console.log("📡 Calling Stringee with payload:", payload);

    const response = await axios.post(
      "https://api.stringee.com/v1/call2/callout",
      JSON.stringify(payload),
      {
        headers: {
          "X-STRINGEE-AUTH": process.env.STRINGEE_ACCESS_TOKEN!,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📞 callViaStringee response:", response.data);
    return response.data;
  } catch (err: any) {
    console.error("❌ callViaStringee error:", err.response?.data || err.message);
    return null; // Không throw nữa để không fail DB
  }
}
