"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connection_1 = require("../database/connection");
const CallLogSchema = new mongoose_1.Schema({
    caller: { type: String, required: true },
    callee: { type: String, required: true },
    callLink: { type: String, required: true },
    status: { type: String, enum: ["pending", "connected", "failed"], default: "pending" },
    startedAt: { type: Date },
    endedAt: { type: Date },
}, { timestamps: true });
// ✅ Gắn model vào zaloMessageDB thay vì mongoose mặc định
exports.default = connection_1.zaloMessageDB.model("CallLog", CallLogSchema);
