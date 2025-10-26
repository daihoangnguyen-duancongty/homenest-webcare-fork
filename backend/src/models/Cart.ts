import mongoose from "mongoose";
import { userDB } from "../database/connection"; // Kết nối đúng đến userDB

const cartItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  quantity: Number,
  discount: String,
  image: String,
  userId: String,
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Mỗi user chỉ có 1 cart
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

// Gắn schema vào userDB (không dùng mongoose.model mặc định!)
export default userDB.model("Cart", cartSchema);
