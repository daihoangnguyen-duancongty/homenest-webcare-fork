import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from './../../api/authApi';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Paper,
  Alert,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = await loginUser(email, password);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'telesale') navigate('/telesale');
      else navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Đã có lỗi xảy ra');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
       
        backgroundImage: `
          linear-gradient(135deg, rgba(79,70,229,0.9), rgba(147,51,234,0.9), rgba(236,72,153,0.9)),
          url('https://homenest.com.vn/wp-content/uploads/2024/12/logo-HN-final-07-1.png')
        `,
        backgroundSize: 'cover',
           backgroundPosition: 'calc(100% - 0vw) center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }}
    >
      <Paper
        elevation={12}
        sx={{
          height: '100vh',
          width: '100%',
          maxWidth: 400,
          borderRadius: 0,
          bgcolor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 6,
          boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
            Đăng nhập
          </Typography>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                py: 1.5,
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #4f46e5, #9333ea)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #4338ca, #7e22ce)',
                },
              }}
            >
              Đăng nhập
            </Button>

            <Typography
              variant="body2"
              textAlign="center"
              mt={3}
              color="textSecondary"
            >
              Chưa có tài khoản?{' '}
              <Box
                component="span"
                onClick={() => navigate('/signup')}
                sx={{
                  color: 'primary.main',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Đăng ký
              </Box>
            </Typography>
          </form>
        </Box>
      </Paper>
    </Box>
  );
}
