import { useEffect } from 'react';
import { Dialog, DialogContent, Typography, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface SuccessPopupProps {
  open: boolean;
  message: string;
  onClose: () => void;
  autoClose?: boolean; // ✅ tự đóng
  duration?: number; // ✅ thời gian tự đóng (ms)
}

export default function SuccessPopup({
  open,
  message,
  onClose,
  autoClose = false,
  duration = 1000,
}: SuccessPopupProps) {
  useEffect(() => {
    if (open && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, autoClose, duration, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          textAlign: 'center',
          py: 3,
          px: 4,
          background: 'white',
          minWidth: 320,
        },
      }}
    >
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CheckCircleOutlineIcon sx={{ fontSize: 60, color: '#4caf50' }} />
          <Typography variant="h6" fontWeight="bold">
            {message}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
