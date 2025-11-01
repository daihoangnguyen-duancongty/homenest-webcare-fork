import jwt from "jsonwebtoken";

export function createStringeeToken(userId: string) {
  const keySid = process.env.STRINGEE_API_KEY_SID;
  const secretKey = process.env.STRINGEE_API_SECRET_KEY;

  if (!keySid || !secretKey) {
    throw new Error("Missing STRINGEE_API_KEY_SID or STRINGEE_API_SECRET_KEY");
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600 * 24; // 1 ngày

  const payload = {
    jti: `${userId}-${now}`,
    iss: keySid,          // ✅ LUÔN DÙNG keySid làm issuer
    rest_api: true,
    userId,
    exp,
  };

  return jwt.sign(payload, secretKey, { algorithm: "HS256" });
}
