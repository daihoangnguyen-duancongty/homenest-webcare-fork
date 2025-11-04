// models/ActiveCall.ts
import { Schema, model } from 'mongoose';

const activeCallSchema = new Schema({
  guestId: { type: String, required: true },
  telesaleId: { type: String, required: true },
  status: { type: String, enum: ['calling', 'ended'], default: 'calling' },
  createdAt: { type: Date, default: Date.now },
});

export default model('ActiveCall', activeCallSchema);
