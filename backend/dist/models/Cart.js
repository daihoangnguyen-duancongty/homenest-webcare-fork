"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connection_1 = require("../database/connection"); // Kết nối đúng đến userDB
const cartItemSchema = new mongoose_1.default.Schema({
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    discount: String,
    image: String,
    userId: String,
});
const cartSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true, // Mỗi user chỉ có 1 cart
    },
    items: [cartItemSchema],
}, { timestamps: true });
// Gắn schema vào userDB (không dùng mongoose.model mặc định!)
exports.default = connection_1.userDB.model("Cart", cartSchema);
