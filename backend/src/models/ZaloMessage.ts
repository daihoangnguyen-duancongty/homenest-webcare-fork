import { Schema, model, Document } from 'mongoose';
import GuestUser, { IGuestUser } from './ZaloGuestUser';
import { zaloMessageDB } from '../database/connection';

export interface IZaloMessage extends Document {
  userId: string | IGuestUser;
  text: string;
  username?: string;
  avatar?: string | null;
  senderType?: 'admin' | 'customer'; // thêm
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
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ZaloMessageModel = zaloMessageDB.model<IZaloMessage>(
  'ZaloMessage',
  ZaloMessageSchema,
  'zaloMessages'
);
export default ZaloMessageModel;
