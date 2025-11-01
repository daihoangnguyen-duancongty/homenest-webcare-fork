import jwt from "jsonwebtoken";

export function createStringeeToken(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600 * 24; // 1 ngày

  const payload = {
    jti: `${userId}-${now}`,
    iss: process.env.STRINGEE_PROJECT_ID,
    rest_api: true,
    userId,
    exp,
  };

  const token = jwt.sign(payload, process.env.STRINGEE_SECRET_KEY!, { algorithm: "HS256" });
  console.log("🔑 Created Stringee token for userId", userId, ":", token.slice(0, 20) + "...");
  return token;
}
