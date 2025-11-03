import { useState, useEffect } from 'react';
import { Backdrop, Typography, Box } from '@mui/material';
import Lottie from 'lottie-react';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
}

// type cho animation JSON Lottie
type LottieAnimationData = object;

export default function LoadingOverlay({
  open,
  message = 'Vui lòng đợi trong giây lát...',
}: LoadingOverlayProps) {
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);

  useEffect(() => {
    fetch('/loading.json')
      .then((res) => res.json())
      .then((data: LottieAnimationData) => setAnimationData(data))
      .catch((err) => console.error('Cannot load Lottie animation:', err));
  }, []);

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 2,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      open={open}
    >
      <Box sx={{ width: 120, height: 120, mb: 2 }}>
        {animationData && <Lottie animationData={animationData} loop />}
      </Box>
      <Typography variant="h6" fontWeight={500}>
        {message}
      </Typography>
    </Backdrop>
  );
}
