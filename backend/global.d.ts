// src/types/global.d.ts
import { IUser } from "./src/models/User";

declare global {
  namespace Express {
    interface Request {
      // Thêm property user vào Request
      user?: IUser & { role: "admin" | "customer"; [key: string]: any };
    }
  }
}
