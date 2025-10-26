import { Schema, model, Document } from 'mongoose';
import { zaloMessageDB } from '../database/connection'; // Dùng db riêng cho Zalo

export interface IGuestUser extends Document {
  _id: string; // Zalo userId
  username: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean; // thêm
}

const guestUserSchema = new Schema<IGuestUser>(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String },
    avatar: { type: String },
    isOnline: { type: Boolean, default: false }, // mặc định offline
  },
  { timestamps: true }
);
const GuestUser = zaloMessageDB.model<IGuestUser>('GuestUser', guestUserSchema, 'guestUsers');

export default GuestUser;
