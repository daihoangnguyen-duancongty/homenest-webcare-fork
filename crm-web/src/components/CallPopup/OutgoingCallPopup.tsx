import { useEffect,useState } from 'react';
import { Box, Button, Typography, Avatar, CircularProgress } from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import PhoneIcon from '@mui/icons-material/Phone';

export default function OutgoingCallPopup({
  guestName,
  guestAvatar,
  onCancel,
  onConnected,
}: {
  guestName: string;
  guestAvatar?: string;
  onCancel: () => void;
  onConnected?: () => void;
}) {


// state cho thời gian gọi
  const [callDuration, setCallDuration] = useState(0);



  useEffect(() => {
    const ring = new Audio('/sounds/calling-tone.mp3');
    ring.loop = true;
    ring.play();
       // Bắt đầu timer
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
   
    return () => {
      ring.pause();
      clearInterval(timer);
    };
  }, []);

  // Chuyển số giây sang mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
        color: '#fff',
      }}
    >
      <Box
        sx={{
          bgcolor: '#1c1f24',
          borderRadius: 4,
          p: 4,
          textAlign: 'center',
          width: 320,
        }}
      >
        <Avatar
          src={guestAvatar || '/default-avatar.png'}
          sx={{ width: 96, height: 96, mx: 'auto', mb: 2 }}
        />
        <Typography variant="h6">{guestName}</Typography>
        <Typography variant="body2" color="gray" sx={{ mb: 3 }}>
          Thời gian gọi...{formatTime(callDuration)}
        </Typography>

        <CircularProgress color="primary" size={24} sx={{ mb: 2 }} />

        <Box display="flex" justifyContent="center" gap={2}>
          <Button
            variant="contained"
            color="error"
            startIcon={<CallEndIcon />}
            onClick={() => onCancel()}
          >
            Kết thúc
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
