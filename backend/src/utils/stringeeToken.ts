import jwt from "jsonwebtoken";

export function createStringeeToken(userId: string) {
  if (!process.env.STRINGEE_PROJECT_ID || !process.env.STRINGEE_SECRET_KEY) {
    throw new Error("Missing STRINGEE_PROJECT_ID or STRINGEE_SECRET_KEY");
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600 * 24; // 1 ngày

  const payload = {
    jti: `${userId}-${now}`,
    iss: process.env.STRINGEE_PROJECT_ID,
    rest_api: true,
    userId,
    exp,
  };

  return jwt.sign(payload, process.env.STRINGEE_SECRET_KEY!, { algorithm: "HS256" });
}

