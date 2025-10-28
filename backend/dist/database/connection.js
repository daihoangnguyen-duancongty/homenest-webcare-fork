"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zaloMessageDB = exports.userDB = exports.productDB = void 0;
// file này phân chia database để post dữ liệu
const mongoose_1 = __importDefault(require("mongoose"));
// Kết nối đến database sản phẩm
exports.productDB = mongoose_1.default.createConnection(process.env.MONGO_URI, {
    dbName: "QuanLySanPham",
});
// Kết nối đến database người dùng
exports.userDB = mongoose_1.default.createConnection(process.env.MONGO_URI, {
    dbName: "QuanLyNguoiDung",
});
// Kết nối đến database người dùng
exports.zaloMessageDB = mongoose_1.default.createConnection(process.env.MONGO_URI, {
    dbName: "QuanLyTinNhanZalo",
});
