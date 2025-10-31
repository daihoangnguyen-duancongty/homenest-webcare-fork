import axios from "axios";

export async function callViaStringee(fromId: string, toId: string) {
  try {
    const response = await axios.post(
      "https://api.stringee.com/v1/call2/callout",
      {
        from: { type: "internal", number: fromId },
        to: [{ type: "internal", number: toId }],
      },
      {
        headers: {
          "X-STRINGEE-AUTH": process.env.STRINGEE_ACCESS_TOKEN,
        },
      }
    );
    console.log("📞 callViaStringee:", response.data);
    return response.data;
  } catch (err: any) {
    console.error("❌ callViaStringee:", err.message);
    throw err;
  }
}
