import { Box, Card, Typography, Grid } from '@mui/material';
import {
  PeopleAlt,
  Chat,
  Assessment,
  Settings,
  AttachMoney,
  Phone,
  Notifications,
  SupportAgent,
} from '@mui/icons-material';

const modules = [
  { name: 'Quản lý khách hàng', icon: <PeopleAlt fontSize="large" />, gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)' },
  { name: 'Chat & Zalo', icon: <Chat fontSize="large" />, gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)' },
  { name: 'Báo cáo & Thống kê', icon: <Assessment fontSize="large" />, gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)' },
  { name: 'Cài đặt hệ thống', icon: <Settings fontSize="large" />, gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' },
  { name: 'Quản lý doanh thu', icon: <AttachMoney fontSize="large" />, gradient: 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)' },
  { name: 'Tổng đài cuộc gọi', icon: <Phone fontSize="large" />, gradient: 'linear-gradient(135deg, #30CFD0 0%, #330867 100%)' },
  { name: 'Thông báo & Lịch hẹn', icon: <Notifications fontSize="large" />, gradient: 'linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 100%)' },
  { name: 'CSKH & Hỗ trợ', icon: <SupportAgent fontSize="large" />, gradient: 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)' },
];


interface DashboardModulesProps {

  sx?: any;
}

export default function DashboardModules({ sx }: DashboardModulesProps) {
  return (
    <Box   sx={{ p: 4, ...sx }}>
      <Grid
        container
        spacing={3}
        justifyContent="center"
        alignItems="center"
      >
        {modules.map((mod, index) => (
          <Grid
            key={index}
            item
            xs={6}
            sm={4}
            md={3}
            lg={2}
            sx={{ display: 'flex', justifyContent: 'center' }}
             {...({} as any)}
          >
            <Card
              sx={{
              
                width: '8vw',
                height: '10vh', // ⚠️ tăng chiều cao 1 chút để hiển thị icon + text đẹp hơn
                background: mod.gradient,
                color: '#fff',
                borderRadius: 3,
                boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.05)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                },
              }}
            >
              {mod.icon}
              <Typography
                variant="body2"
                textAlign="center"
                fontWeight={600}
                sx={{ mt: 1 }}
              >
                {mod.name}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
