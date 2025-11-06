import { Schema, Document } from 'mongoose';
import { zaloMessageDB } from '../database/connection';

export interface IGuestUser extends Document {
  _id: string; // Zalo userId
  username: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
  lastInteraction?: Date;
  assignedTelesale?: string | null;
  label?: string;
}

const guestUserSchema = new Schema<IGuestUser>(
  {
    _id: { type: String, required: true }, // lưu Zalo userId
    username: { type: String, required: true },
    email: { type: String },
    avatar: { type: String },
    isOnline: { type: Boolean, default: false },
    lastInteraction: { type: Date, default: null },
    assignedTelesale: { type: String, default: null },
    label: { type: String, default: '' },
  },
  { timestamps: true }
);

const GuestUser = zaloMessageDB.model<IGuestUser>('GuestUser', guestUserSchema, 'guestUsers');
export default GuestUser;
