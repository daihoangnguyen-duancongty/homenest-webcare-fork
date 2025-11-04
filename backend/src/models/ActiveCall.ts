import { Schema } from 'mongoose';
import { zaloMessageDB } from '../database/connection'; 

const activeCallSchema = new Schema({
  guestId: { type: String, required: true },
  telesaleId: { type: String, required: true },
  status: { type: String, enum: ['calling', 'ended'], default: 'calling' },
  createdAt: { type: Date, default: Date.now },
});

// ✅ Gắn model vào zaloMessageDB (thay vì default mongoose)
const ActiveCall = zaloMessageDB.model('ActiveCall', activeCallSchema);

export default ActiveCall;
