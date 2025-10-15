"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCartItem = exports.removeFromCart = exports.addToCart = exports.getCartByUserId = void 0;
const connection_1 = require("../database/connection");
// ======================= Lấy cart của user =======================
const getCartByUserId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (!userId) {
        res.status(400).json({ message: 'Thiếu userId' });
        return; // thoát hàm
    }
    try {
        const cart = yield connection_1.prisma.cart.findFirst({ where: { userId } });
        if (!cart) {
            res.status(404).json({ message: 'Không tìm thấy cart' });
            return;
        }
        res.status(200).json(cart); // chỉ gọi res.status(...).json(...)
    }
    catch (error) {
        console.error('❌ Lỗi khi lấy cart:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy cart' });
    }
});
exports.getCartByUserId = getCartByUserId;
// ======================= Thêm sản phẩm vào cart =======================
const addToCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, productId, quantity, price } = req.body;
    if (!userId || !productId || !quantity || !price) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    try {
        // Lấy cart hiện tại của user
        let cart = yield connection_1.prisma.cart.findFirst({
            where: { userId },
        });
        const newItem = { productId, quantity, price };
        if (cart) {
            // Cập nhật items
            const updatedItems = [...cart.items, newItem];
            cart = yield connection_1.prisma.cart.update({
                where: { id: cart.id },
                data: { items: updatedItems },
            });
        }
        else {
            // Tạo cart mới
            cart = yield connection_1.prisma.cart.create({
                data: {
                    userId,
                    items: [newItem],
                },
            });
        }
        res.status(200).json({ message: 'Thêm sản phẩm vào cart thành công', cart });
    }
    catch (error) {
        console.error('❌ Lỗi khi thêm sản phẩm vào cart:', error);
        res.status(500).json({ message: 'Lỗi server khi thêm sản phẩm vào cart' });
    }
});
exports.addToCart = addToCart;
// ======================= Xoá sản phẩm khỏi cart =======================
const removeFromCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    try {
        const cart = yield connection_1.prisma.cart.findFirst({ where: { userId } });
        if (!cart) {
            return res.status(404).json({ message: 'Không tìm thấy cart' });
        }
        const updatedItems = cart.items.filter((item) => item.productId !== productId);
        const updatedCart = yield connection_1.prisma.cart.update({
            where: { id: cart.id },
            data: { items: updatedItems },
        });
        res.status(200).json({ message: 'Xoá sản phẩm khỏi cart thành công', cart: updatedCart });
    }
    catch (error) {
        console.error('❌ Lỗi khi xoá sản phẩm khỏi cart:', error);
        res.status(500).json({ message: 'Lỗi server khi xoá sản phẩm khỏi cart' });
    }
});
exports.removeFromCart = removeFromCart;
// ======================= Cập nhật số lượng sản phẩm trong cart =======================
const updateCartItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, productId, quantity } = req.body;
    if (!userId || !productId || quantity === undefined) {
        res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        return; // thoát hàm
    }
    try {
        const cart = yield connection_1.prisma.cart.findFirst({ where: { userId } });
        if (!cart) {
            res.status(404).json({ message: 'Không tìm thấy cart' });
            return;
        }
        const updatedItems = cart.items.map((item) => {
            if (item.productId === productId) {
                return Object.assign(Object.assign({}, item), { quantity });
            }
            return item;
        });
        yield connection_1.prisma.cart.update({
            where: { id: cart.id },
            data: { items: updatedItems },
        });
        res
            .status(200)
            .json({
            message: 'Cập nhật sản phẩm trong cart thành công',
            cart: Object.assign(Object.assign({}, cart), { items: updatedItems }),
        });
        return; // không return giá trị nào
    }
    catch (error) {
        console.error('❌ Lỗi khi cập nhật cart:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật cart' });
        return;
    }
});
exports.updateCartItem = updateCartItem;
