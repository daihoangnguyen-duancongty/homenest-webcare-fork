import { Schema, Document } from 'mongoose';
import { zaloMessageDB } from '../database/connection';
import GuestUser, { IGuestUser } from './ZaloGuestUser';

export interface IZaloMessage extends Document {
  userId: string | IGuestUser; // liên kết tới GuestUser
  text: string;
  username?: string;
  avatar?: string | null;
  senderType?: 'admin' | 'customer' | 'telesale';
  success: boolean;
  response: any;
  assignedTelesale?: string;
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ZaloMessageSchema = new Schema<IZaloMessage>(
  {
    userId: { type: String, ref: 'GuestUser', required: true },
    text: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    success: { type: Boolean, required: true },
    response: { type: Schema.Types.Mixed },
    username: { type: String },
    avatar: { type: String },
    assignedTelesale: { type: String, default: null },
    senderType: { type: String, enum: ['admin','telesale','customer'], default: 'customer' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ZaloMessageModel = zaloMessageDB.model<IZaloMessage>('ZaloMessage', ZaloMessageSchema, 'zaloMessages');
export default ZaloMessageModel;
