import { useEffect } from 'react';
import { Box, Button, Typography, Avatar } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import CallEndIcon from '@mui/icons-material/CallEnd';

export default function IncomingCallPopup({
  callerName,
  callerAvatar,
  onAccept,
  onReject,
}: {
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onReject: () => void;
}) {
  useEffect(() => {
    const ringtone = new Audio('/sounds/incoming-call.mp3');
    ringtone.loop = true;
    ringtone.play();
    return () => ringtone.pause();
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 3000,
        width: '100vw',
        height: '100vh',
        bgcolor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          bgcolor: '#1c1f24',
          borderRadius: 4,
          p: 4,
          textAlign: 'center',
          color: '#fff',
          width: 320,
        }}
      >
        <Avatar
          src={callerAvatar || '/default-avatar.png'}
          sx={{ width: 96, height: 96, mx: 'auto', mb: 2 }}
        />
        <Typography variant="h6">{callerName}</Typography>
        <Typography variant="body2" color="gray" sx={{ mb: 3 }}>
          đang gọi cho bạn...
        </Typography>
        <Box display="flex" justifyContent="center" gap={2}>
          <Button variant="contained" color="success" startIcon={<PhoneIcon />} onClick={onAccept}>
            Trả lời
          </Button>
          <Button variant="contained" color="error" startIcon={<CallEndIcon />} onClick={onReject}>
            Từ chối
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
