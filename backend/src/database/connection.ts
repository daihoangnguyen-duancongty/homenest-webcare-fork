// file này phân chia database để post dữ liệu
import mongoose from "mongoose";

// Kết nối đến database sản phẩm
export const productDB = mongoose.createConnection(process.env.MONGO_URI as string, {
  dbName: "QuanLySanPham",
});

// Kết nối đến database người dùng
export const userDB = mongoose.createConnection(process.env.MONGO_URI as string, {
  dbName: "QuanLyNguoiDung",
});
// Kết nối đến database người dùng
export const zaloMessageDB = mongoose.createConnection(process.env.MONGO_URI as string, {
  dbName: "QuanLyTinNhanZalo",
});
