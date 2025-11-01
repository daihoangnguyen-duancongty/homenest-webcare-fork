// utils/callViaStringee.ts
import axios from "axios";

export interface StringeeCallResult {
  r: number;
  message: string;
  call_id?: string;
  [key: string]: any;
}

/**
 * Gọi Stringee từ CRM → khách hàng
 * @param fromId string - ID gọi đi (guestId)
 * @param toId string - ID telesale nhận
 * @param token string - token Stringee của telesale
 */
export async function callViaStringee(
  fromId: string,
  toId: string,
  token?: string
): Promise<StringeeCallResult> {
  try {
    if (!token && !process.env.STRINGEE_ACCESS_TOKEN) {
      throw new Error("Missing Stringee token");
    }

    const response = await axios.post(
      "https://api.stringee.com/v1/call2/callout",
      {
        from: { type: "internal", number: fromId },
        to: [{ type: "internal", number: toId }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-STRINGEE-AUTH": token || process.env.STRINGEE_ACCESS_TOKEN!,
        },
        timeout: 10000,
      }
    );

    console.log("📞 callViaStringee response:", response.data);
    return response.data;
  } catch (err: any) {
    console.error("❌ callViaStringee error:", err.response?.data || err.message);
    throw err;
  }
}
