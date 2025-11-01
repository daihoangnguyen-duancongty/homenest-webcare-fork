import { RtcRole, RtcTokenBuilder } from "agora-access-token";

const APP_ID = process.env.AGORA_APP_ID!;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;

/**
 * Tạo token Agora cho userId
 */
export const createAgoraToken = (channelName: string, userId: string): string => {
  const role = RtcRole.PUBLISHER;
  const expireTime = 3600; // 1 tiếng
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTime;

  const token = RtcTokenBuilder.buildTokenWithAccount(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    userId,
    role,
    privilegeExpiredTs
  );
  return token;
};
