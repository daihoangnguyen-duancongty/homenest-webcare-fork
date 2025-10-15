import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  isExpanded: boolean;
  activeSection: string;
}

export default function Header({ isExpanded, activeSection }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    handleMenuClose();
    navigate('/login');
  };

  // Lấy user từ localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const username = user.username || 'User';

  let label = '';
  switch (activeSection) {
    case 'chat':
      label = 'Quản lý cuộc trò chuyện';
      break;
    case 'customers':
      label = 'Quản lý Khách hàng';
      break;
    case 'automation':
      label = 'Tự động hóa';
      break;
    case 'reports':
      label = 'Báo cáo';
      break;
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        top: 0,
        left: isExpanded ? 280 : 60,
        right: 0,
        height: '6.5vh',
        background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 100%)',
        color: 'text.primary',
        borderBottom: '1px solid #e5e7eb',
        transition: 'left 0.3s ease',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 900,
      }}
    >
      <Toolbar sx={{ height: '100%', justifyContent: 'space-between', px: 4 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            background: 'linear-gradient(90deg, #2563eb, #4f46e5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
          }}
        >
          {label}
        </Typography>

        <Box
          display="flex"
          alignItems="center"
          gap={2}
          sx={{
            position: 'absolute',
            right: '14vw',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <IconButton onClick={handleMenuOpen}>
            <Avatar
              alt={username}
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=tech"
              sx={{ width: 30, height: 30 }}
            />
          </IconButton>
          <Typography variant="body1" fontWeight={500}>
            Xin chào, <strong>{username}</strong>
          </Typography>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>Cài đặt</MenuItem>
            <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
