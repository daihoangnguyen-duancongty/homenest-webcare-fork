"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const connection_1 = require("../database/connection"); // Đường dẫn đúng đến nơi export productDB
const ProductSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: String, required: true },
    profit: { type: String, required: true },
    source: { type: String, required: true },
    way: { type: String, required: true },
    image: {
        type: {
            path: { type: String, required: true },
            filename: { type: String, required: true },
            originalname: { type: String, required: true }
        },
        required: true
    },
    createdAt: { type: Date, default: Date.now },
});
const Product = connection_1.productDB.model("Product", ProductSchema, "products");
exports.default = Product;
