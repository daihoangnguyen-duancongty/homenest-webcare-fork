// src/config/fetchConfig.ts
/**
 * Dùng để quản lý các URL và endpoint cố định của hệ thống
 * Giúp dễ thay đổi domain khi deploy
 */

export const FRONTEND_URL = process.env.FRONTEND_URL!;
export const BACKEND_URL = process.env.BACKEND_URL!;
