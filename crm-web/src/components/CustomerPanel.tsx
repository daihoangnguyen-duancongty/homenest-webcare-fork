import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Typography,
  Button,
  CircularProgress,
  Grid,
} from '@mui/material';
import { fetchGuestUsers } from '../api/adminApi';
import type { GuestUser } from '../types';

interface CustomerPanelProps {
  onOpenChat: (userId: string) => void;
  sx?: any;
}

export default function CustomerPanel({ onOpenChat, sx }: CustomerPanelProps) {
  const [customers, setCustomers] = useState<GuestUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchGuestUsers();
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!customers.length) {
    return <Typography variant="h6">Không có khách hàng nào</Typography>;
  }

  return (
    <Box sx={{ p: 3, ...sx }}>
      <Grid
        container
        spacing={3}
        justifyContent="center"
        alignItems="stretch"
      >
        {customers.map((cus) => (
          <Grid
            item
            key={cus._id}
            xs={12}
            sm={6}
            md={4}
            lg={3}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'stretch',

            }}
             {...({} as any)}
          >
            <Card
              sx={{
                width: '16vw', // dùng vw để tự co giãn theo màn hình
                height: '24vh', // đảm bảo các card cao bằng nhau
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: 4,
                boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                background:
                  'linear-gradient(135deg, #6EE7B7 0%, #8867d7ff 50%, #EC4899 100%)',
                color: '#fff',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  background:
                    'linear-gradient(135deg, #34D399 0%, #7C3AED 50%, #F472B6 100%)',
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    src={cus.avatar}
                    alt={cus.username}
                    sx={{
                      width: 48,
                      height: 48,
                      border: '2px solid rgba(255,255,255,0.7)',
                    }}
                  />
                }
                title={
                  <Typography fontWeight={600} color="#fff" noWrap>
                    {cus.username}
                  </Typography>
                }
                subheader={
                  <Typography
                    variant="body2"
                    color="rgba(255,255,255,0.85)"
                    noWrap
                  >
                    {cus.email ?? `${cus._id}@zalo.local`}
                  </Typography>
                }
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="rgba(255,255,255,0.9)">
                  <strong>Trạng thái:</strong>{' '}
                  <span style={{ color: cus.isOnline ? '#C8E6C9' : '#ECEFF1' }}>
                    {cus.isOnline ? 'Đang hoạt động' : 'Offline'}
                  </span>
                </Typography>

                {cus.lastInteraction && (
                  <Typography
                    variant="body2"
                    mt={1}
                    color="rgba(255,255,255,0.9)"
                    sx={{ wordWrap: 'break-word' }}
                  >
                    <strong>Lần tương tác:</strong>{' '}
                    {new Date(cus.lastInteraction).toLocaleString('vi-VN')}
                  </Typography>
                )}
              </CardContent>

              <Box mt="auto" textAlign="center" pb={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={() => onOpenChat(cus._id)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 3,
                    backgroundColor: '#FFCA28',
                    color: '#333',
                    '&:hover': { backgroundColor: '#FFD54F' },
                  }}
                >
                  Mở chat
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
