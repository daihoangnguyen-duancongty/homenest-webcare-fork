// FILE NÀY NHẬN KẾT QUẢ TỪ CONTROLLER PHÙ HỢP ĐỂ XỬ LÝ VÀ ĐIỀU HƯỚNG CHO SERVER ĐỂ VÀO DATABASE THỰC HIỆN THAY ĐỔI TRONG DATABASE
import { Router } from "express";
import { getProducts,getProductById, addProduct,updateProduct,deleteProduct } from "../controllers/productController";
import multer from 'multer';


// Tạo router
const router = Router();

// Cấu hình multer để xử lý file tải lên
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Đảm bảo rằng thư mục 'uploads' tồn tại
    cb(null, 'uploads/');  // Đảm bảo bạn có thư mục 'uploads' trong project của mình
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất bằng cách sử dụng thời gian hiện tại
    cb(null, Date.now() + '-' + file.originalname);  // Tên file sau khi tải lên
  },
});

const upload = multer({ storage });

router.get("/",upload.single("image"),getProducts);// Lấy tất cả sản phẩm
router.get("/:id", getProductById);  // Lấy sản phẩm theo id, không cần "/products" nữa
router.post("/", upload.single("image"), addProduct);// tạo mới sản phẩm
router.patch("/:id", upload.single("image"), updateProduct); // Update sản phẩm
router.delete("/:id", deleteProduct);  // Route xóa sản phẩm theo ID
// Route cho tìm kiếm sản phẩm
// router.get("/", getProducts);

export default router;
