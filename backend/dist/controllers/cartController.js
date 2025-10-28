"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCartByUserId = exports.getCartByUserId = void 0;
const Cart_1 = __importDefault(require("../models/Cart"));
// Hàm lấy giỏ hàng theo id user
const getCartByUserId = async (req, res) => {
    console.log("User trong token:", req.user);
    try {
        const cart = await Cart_1.default.findOne({ userId: req.params.userId });
        if (!cart) {
            console.log(" Không tìm thấy giỏ hàng. Trả về rỗng.");
            res.status(200).json({ items: [] }); // Trả về mảng rỗng nếu không có cart
            return;
        }
        console.log(" Đã tìm thấy giỏ hàng:", cart.items);
        res.json({ items: cart.items });
    }
    catch (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
        res.status(500).json({ message: "Lỗi server", error });
    }
};
exports.getCartByUserId = getCartByUserId;
// Hàm cập nhật giỏ hàng theo id user
const updateCartByUserId = async (req, res) => {
    try {
        const { items } = req.body;
        const userId = req.params.userId;
        const updatedCart = await Cart_1.default.findOneAndUpdate({ userId }, { items }, { upsert: true, new: true });
        res.json(updatedCart);
    }
    catch (error) {
        res.status(500).json({ message: "Không thể cập nhật giỏ hàng", error });
    }
};
exports.updateCartByUserId = updateCartByUserId;
