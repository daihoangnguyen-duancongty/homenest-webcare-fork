// file này nhận dữ liệu trực tiếp được dispach từ thunks redux ở Frontend sau khi bấm nút submit ở component
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authenticateJWT"; 
import Cart from "../models/Cart";


// Hàm lấy giỏ hàng theo id user
export const getCartByUserId = async (req: AuthRequest, res: Response) => {
  console.log("User trong token:", req.user);

  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
    console.log(" Không tìm thấy giỏ hàng. Trả về rỗng.");
     res.status(200).json({ items: [] }); // Trả về mảng rỗng nếu không có cart
      return 
    }
    console.log(" Đã tìm thấy giỏ hàng:", cart.items);
    res.json({ items: cart.items });
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Hàm cập nhật giỏ hàng theo id user

export const updateCartByUserId = async (req: Request, res: Response) => {

  try {
    const { items } = req.body;
    const userId = req.params.userId;

    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { items },
      { upsert: true, new: true }
    );

    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: "Không thể cập nhật giỏ hàng", error });
  }
};




