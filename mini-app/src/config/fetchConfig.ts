/**
 * Dùng để quản lý các URL cố định của hệ thống
 * Giúp dễ thay đổi domain khi deploy
 */

export const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || 'https://homenest-webcare.vercel.app';

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://homenest-webcare-fork-production.up.railway.app';
