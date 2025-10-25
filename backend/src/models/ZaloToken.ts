import { Schema, model, Document } from 'mongoose';
import { userDB } from '../database/connection';

export interface IZaloToken extends Document {
  access_token: string;
  refresh_token: string;
  expires_at: Date;
  createdAt?: Date;
}

const ZaloTokenSchema = new Schema<IZaloToken>({
  access_token: { type: String, required: true },
  refresh_token: { type: String, required: true },
  expires_at: { type: Date, required: true },
}, { timestamps: true });

export default userDB.model<IZaloToken>('ZaloToken', ZaloTokenSchema, 'zaloTokens');
