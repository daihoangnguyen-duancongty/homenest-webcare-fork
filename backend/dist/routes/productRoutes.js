"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// FILE NÀY SẼ NHẬN KẾT QUẢ TỪ CONTROLLER PHÙ HỢP ĐỂ XỬ LÝ VÀ ĐIỀU HƯỚNG CHO SERVER ĐỂ VÀO DATABASE THỰC HIỆN THAY ĐỔI TRONG DATABASE
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const multer_1 = __importDefault(require("multer"));
// Tạo router
const router = (0, express_1.Router)();
// Cấu hình multer để xử lý file tải lên
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Đảm bảo rằng thư mục 'uploads' tồn tại
        cb(null, 'uploads/'); // Đảm bảo bạn có thư mục 'uploads' trong project của mình
    },
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất bằng cách sử dụng thời gian hiện tại
        cb(null, Date.now() + '-' + file.originalname); // Tên file sau khi tải lên
    },
});
const upload = (0, multer_1.default)({ storage });
router.get("/", upload.single("image"), productController_1.getProducts); // Lấy tất cả sản phẩm
router.get("/:id", productController_1.getProductById); // Lấy sản phẩm theo id, không cần "/products" nữa
router.post("/", upload.single("image"), productController_1.addProduct); // tạo mới sản phẩm
router.patch("/:id", upload.single("image"), productController_1.updateProduct); // Update sản phẩm
router.delete("/:id", productController_1.deleteProduct); // Route xóa sản phẩm theo ID
// Route cho tìm kiếm sản phẩm
// router.get("/", getProducts);
exports.default = router;
