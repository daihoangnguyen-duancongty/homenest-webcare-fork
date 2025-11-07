// src/components/DeleteConfirmDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { deleteUserMessages } from './../api/zaloApi';
import type { ConversationWithAssign } from './Sidebar/SidebarLayout';

interface DeleteConfirmDialogProps {
  open: boolean;
  conv: ConversationWithAssign | null;
  onClose: () => void;
  setToast: React.Dispatch<React.SetStateAction<{ open: boolean; message: string }>>;
  setConversations: React.Dispatch<React.SetStateAction<ConversationWithAssign[]>>;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  conv,
  onClose,
  setToast,
  setConversations,
}) => {
  const handleDelete = async () => {
    if (!conv) return;
    try {
      await deleteUserMessages(conv.userId);
      setConversations((prev) => prev.filter((c) => c.userId !== conv.userId));
      setToast({
        open: true,
        message: `🗑️ Đã xóa hội thoại với ${conv.name || conv.userId}`,
      });
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: '❌ Xóa thất bại' });
    } finally {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} sx={{ zIndex: 2600 }}>
      <DialogTitle>Xác nhận xóa hội thoại</DialogTitle>
      <DialogContent>
        <Typography>
          Bạn có chắc muốn <strong>xóa toàn bộ tin nhắn</strong> của{' '}
          <strong>{conv?.name || conv?.userId}</strong> không?
          <br />
          Hành động này <strong>không thể hoàn tác.</strong>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" color="error" onClick={handleDelete}>
          Xóa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
