import { Request, Response } from 'express';
import GuestUser from '../models/ZaloGuestUser';

/**
 * Lấy danh sách khách hàng (guest users từ Zalo)
 */
export const getGuestUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await GuestUser.find().sort({ updatedAt: -1 }).lean();
    res.status(200).json(users);
  } catch (err: any) {
    console.error('❌ Lỗi khi lấy danh sách khách hàng:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách khách hàng' });
  }
};

/**
 * Lấy thông tin 1 khách hàng theo ID (Zalo userId)
 */
export const getGuestUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await GuestUser.findById(id).lean();
    if (!user) {
      res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      return;
    }
    res.status(200).json(user);
  } catch (err: any) {
    console.error('❌ Lỗi khi lấy khách hàng theo ID:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy khách hàng' });
  }
};
// 🟢 Gán nhãn cho khách hàng
export const updateGuestLabel = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { label } = req.body;

    if (!userId) {
      res.status(400).json({ message: 'Thiếu userId' });
      return;
    }

    const updated = await GuestUser.findByIdAndUpdate(userId, { $set: { label } }, { new: true });

    if (!updated) {
      res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      return;
    }

    res.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('❌ Lỗi khi cập nhật nhãn:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhãn' });
  }
};
