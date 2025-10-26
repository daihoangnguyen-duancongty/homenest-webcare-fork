// FILE NÀY XỬ LÝ REQUEST NHẬN ĐƯỢC TỪ FRONTEND ĐẾN CONTROLLER PHÙ HỢP ĐỂ XỬ LÝ VÀ ĐIỀU HƯỚNG ĐẾN SERVER ĐỂ VÀO DATABASE TỪ ROUTES VÀ NHẬN RESPONSE ĐỂ LẤY DỮ LIỆU VỀ TỪ BACKEND
import { Request, Response } from "express";
import Product from "../models/Product"; // Import model sản phẩm

// Hàm lấy tất cả sản phẩm
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
     const { search } = req.query;

  let query: any = {};

    if (search) {
      // Sử dụng biểu thức chính quy không phân biệt hoa thường
      query.name = { $regex: search, $options: "i" };
    }
    const products = await Product.find(query);  // Lấy tất cả sản phẩm từ cơ sở dữ liệu
    res.status(200).json(products);  // Trả về danh sách sản phẩm dưới dạng JSON
  } catch (error) {
       console.error("Lỗi khi lấy sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
// Hàm lấy sản phẩm theo id
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;  // Lấy ID từ tham số route

  if (!id) {
    res.status(400).json({ message: "Thiếu ID sản phẩm" });
    return;
  }

  try {
    const product = await Product.findById(id);  // Tìm sản phẩm theo id

    if (!product) {
      res.status(404).json({ message: "Sản phẩm không tìm thấy" });
      return;
    }

    res.status(200).json({ product });  // Trả về sản phẩm nếu tìm thấy
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm", error });
  }
};
// Hàm thêm sản phẩm mới
export const addProduct = async (req: Request, res: Response) => {
  if (!req.body) {
    res.status(400).json({ message: "Không có dữ liệu từ client." });
    return;
  }

  let { name, type,price, discount, profit, source, way } = req.body;
  const image = req.file; // Nhận file ảnh từ yêu cầu gửi lên

  // Kiểm tra các trường bắt buộc
  if (!name || !type || !price || !image) {
    res.status(400).json({ message: "Thiếu thông tin bắt buộc: name, type,price, image" });
    return;
  }

  // Làm sạch dữ liệu

  name = name.trim().toLowerCase();
  type = type?.trim() || "";
  price = parseFloat(price);
  discount = discount?.trim() || "";
  profit = profit?.trim() || "";
  source = source?.trim() || "";
  way = way?.trim() || "";

  if (isNaN(price)) {
    res.status(400).json({ message: "Giá sản phẩm không hợp lệ" });
    return;
  }

  console.log("Đã nhận được request thêm sản phẩm mới từ productController:", req.body);

  try {
    const existing = await Product.findOne({ name });
    if (existing) {
      res.status(400).json({ message: "Sản phẩm đã tồn tại." });
      return;
    }

    const newProduct = new Product({
      name,
      type,
      price,
      discount,
      profit,
      source,
      way,
      image: {
        path: image.path,
        filename: image.filename,
        originalname: image.originalname,
      },
      createdAt: new Date(),
    });

    await newProduct.save();

    res.status(201).json({
      message: "Thêm sản phẩm mới thành công",
      product: newProduct,
    });
  } catch (error: any) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    if (error.code === 11000) {
      res.status(400).json({ message: "Tên sản phẩm đã tồn tại" });
    } else {
      res.status(500).json({ message: "Lỗi server", error });
    }
  }
};
// Hàm cập nhật sản phẩm
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
const { name, type, price, discount, profit, source, way } = req.body || {};
  const image = req.file; // Cập nhật ảnh nếu có file upload mới

  if (!id) {
    res.status(400).json({ message: "Thiếu ID sản phẩm" });
    return;
  }

  if (!name && !type && !price && !discount && !profit && !source && !way && !image) {
    res.status(400).json({ message: "Cần có ít nhất một trường để cập nhật" });
    return;
  }

  const updatedData: any = {};

  if (name) updatedData.name = name.trim().toLowerCase();
  if (type) updatedData.type = type.trim();
  if (price) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      res.status(400).json({ message: "Giá sản phẩm không hợp lệ" });
      return;
    }
    updatedData.price = parsedPrice;
  }
  if (discount) updatedData.discount = discount.trim();
  if (profit) updatedData.profit = profit.trim();
  if (source) updatedData.source = source.trim();
  if (way) updatedData.way = way.trim();

  if (image) {
    updatedData.image = {
      path: image.path,
      filename: image.filename,
      originalname: image.originalname,
    };
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      res.status(404).json({ message: "Sản phẩm không tìm thấy" });
      return;
    }

    res.status(200).json({ message: "Cập nhật sản phẩm thành công", product: updatedProduct });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm", error });
  }
};
// Hàm xóa sản phẩm
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Thiếu ID sản phẩm" });
    return;
  }

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      res.status(404).json({ message: "Sản phẩm không tìm thấy" });
      return;
    }

    res.status(200).json({ message: "Sản phẩm đã được xóa thành công", product: deletedProduct });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi xóa sản phẩm", error });
  }
};




