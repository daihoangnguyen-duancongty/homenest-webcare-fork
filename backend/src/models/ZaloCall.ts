import { Schema, Document } from "mongoose";
import { zaloMessageDB } from "../database/connection"; 

export interface ICallLog extends Document {
  caller: string;         
  callee: string;          
  callLink: string;
  status: "pending" | "connected" | "failed";
  startedAt?: Date;
  endedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const CallLogSchema = new Schema<ICallLog>(
  {
    caller: { type: String, required: true },
    callee: { type: String, required: true },
    callLink: { type: String, required: true },
    status: { type: String, enum: ["pending", "connected", "failed"], default: "pending" },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

// ✅ Gắn model vào zaloMessageDB thay vì mongoose mặc định
export default zaloMessageDB.model<ICallLog>("CallLog", CallLogSchema);
