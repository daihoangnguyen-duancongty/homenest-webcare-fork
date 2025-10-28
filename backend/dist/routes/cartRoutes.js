"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticateJWT_1 = require("../middleware/authenticateJWT");
const authorizeRole_1 = require("../middleware/authorizeRole");
const router = (0, express_1.Router)();
// Trước đây dùng authorizeCustomer
// Bây giờ dùng authorizeRoles nếu muốn admin + telesale
router.get('/my-cart', authenticateJWT_1.authenticateToken, (0, authorizeRole_1.authorizeRoles)(['admin', 'telesale']), async (req, res) => {
    // logic của cart
    res.json({ message: 'Cart data' });
});
exports.default = router;
