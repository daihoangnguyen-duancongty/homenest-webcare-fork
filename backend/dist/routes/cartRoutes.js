"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FILE NÀY NHẬN KẾT QUẢ TỪ CONTROLLER PHÙ HỢP ĐỂ XỬ LÝ VÀ ĐIỀU HƯỚNG CHO SERVER ĐỂ VÀO DATABASE THỰC HIỆN THAY ĐỔI TRONG DATABASE
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const authenticateJWT_1 = require("../middleware/authenticateJWT");
const authorizeRole_1 = require("../middleware/authorizeRole");
// Tạo router
const router = (0, express_1.Router)();
router.get('/:userId/cart', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeCustomer, cartController_1.getCartByUserId); // Lấy giỏ hàng theo user ID + Bảo vệ route này bằng cách yêu cầu người dùng phải có token hợp lệ và quyền customer
router.post('/:userId/cart', authenticateJWT_1.authenticateToken, authorizeRole_1.authorizeCustomer, cartController_1.updateCartItem); // Cập nhật giỏ hàng theo user ID
exports.default = router;
