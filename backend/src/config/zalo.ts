// config/zalo.ts
export function getZaloConfig() {
  return {
    APP_ID: process.env.ZALO_APP_ID!,
    APP_SECRET: process.env.ZALO_APP_SECRET!,
    REFRESH_TOKEN: process.env.ZALO_REFRESH_TOKEN!,
  };
}
