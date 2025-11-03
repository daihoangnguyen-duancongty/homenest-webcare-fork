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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { AppBarProps } from '@mui/material';

interface HeaderProps extends AppBarProps {
  activeSection: string;
  isMobile?: boolean;
  isExpanded?: boolean;
}

export default function Header({ activeSection, isMobile, isExpanded, ...props }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isTabletOrMobile = useMediaQuery(theme.breakpoints.down('md'));
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
  const avatarUrl = user.avatar?.path || '';
  let label = '';
  switch (activeSection) {
    case 'chat':
      label = 'Quản lý cuộc trò chuyện';
      break;
    case 'employee':
      label = 'Quản lý nhân viên';
      break;
    case 'customer':
      label = 'Quản lý khách hàng';
      break;
    case 'automation':
      label = 'Tự động hóa';
      break;
    case 'reports':
      label = 'Báo cáo';
      break;
  }
  const left = isTabletOrMobile ? 0 : isExpanded ? 280 : 60;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        top: 0,
        left: left,
        right: 0,
        height: '6.5vh',
        background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 100%)',
        color: 'text.primary',
        borderBottom: '1px solid #e5e7eb',
        transition: 'left 0.3s ease',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1100,
        ...props.sx,
      }}
      {...props}
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
          <Box onClick={handleMenuOpen} sx={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <Avatar alt={username} src={avatarUrl} sx={{ width: 30, height: 30 }} />

            {/* Chỉ show greeting khi desktop */}
            {!isTabletOrMobile && (
              <Typography variant="body1" fontWeight={500}>
                Xin chào, <strong>{username}</strong>
              </Typography>
            )}
          </Box>
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
