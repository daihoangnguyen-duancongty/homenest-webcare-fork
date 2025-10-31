// src/components/CustomerPanel.tsx
import { useEffect, useState } from 'react';
import { Box, Card, CardHeader, CardContent, Avatar, Typography, Button, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid';
import { fetchGuestUsers } from '../api/adminApi'; // hoặc tạo riêng fetchGuestUsers
import type { GuestUser } from '../types';

interface CustomerPanelProps {
  onOpenChat: (userId: string) => void;
}

export default function CustomerPanel({ onOpenChat }: CustomerPanelProps) {
  const [customers, setCustomers] = useState<GuestUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchGuestUsers(); // hoặc fetchGuestUsers()
        setCustomers(data);
      } catch (err) {
        console.error('❌ Fetch customers failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!customers.length) {
    return <Typography variant="h6">Không có khách hàng nào</Typography>;
  }

  return (
    <Grid container spacing={2}>
      {customers.map((cus) => (
        <Grid container spacing={2} {...({} as any)}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          >
            <CardHeader
              avatar={<Avatar src={cus.avatar} alt={cus.username} />}
              title={<Typography fontWeight={600}>{cus.username}</Typography>}
              subheader={cus.email ?? `${cus.userId}@zalo.local`}
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                <strong>Trạng thái:</strong>{' '}
                <span style={{ color: cus.isOnline ? 'green' : 'gray' }}>
                  {cus.isOnline ? 'Đang hoạt động' : 'Offline'}
                </span>
              </Typography>
              {cus.lastInteraction && (
                <Typography variant="body2" mt={1} color="text.secondary">
                  <strong>Lần tương tác:</strong>{' '}
                  {new Date(cus.lastInteraction).toLocaleString('vi-VN')}
                </Typography>
              )}
              <Box mt={2} textAlign="center">
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => onOpenChat(cus.userId)}
                >
                  Mở chat
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
