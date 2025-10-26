import { Schema, model, Document } from "mongoose";
import GuestUser, { IGuestUser } from "./ZaloGuestUser";
import { zaloMessageDB } from "../database/connection";

export interface IZaloMessage extends Document {
  userId: string | IGuestUser; // userId là string (Zalo) hoặc GuestUser document
  text: string;
  sentAt: Date;
  success: boolean;
  response?: any;
  username?: string;
  avatar?: string;
  createdAt: Date;
}

const ZaloMessageSchema = new Schema<IZaloMessage>(
  {
    userId: { type: String, ref: "GuestUser", required: true },
    text: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    success: { type: Boolean, required: true },
    response: { type: Schema.Types.Mixed },
    username: { type: String },
    avatar: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default zaloMessageDB.model<IZaloMessage>("ZaloMessage", ZaloMessageSchema, "zaloMessages");
