import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from './../../api/authApi';
import { Box, Button, TextField, Typography, InputAdornment, Paper, Alert } from '@mui/material';
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
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #4f46e5, #9333ea, #ec4899)',
      }}
    >
      <Paper
        elevation={12}
        sx={{
          p: 6,
          maxWidth: 400,
          width: '90%',
          borderRadius: 4,
          backdropFilter: 'blur(10px)',
          bgcolor: 'rgba(255,255,255,0.9)',
        }}
      >
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

          <Typography variant="body2" textAlign="center" mt={2} color="textSecondary">
            Chưa có tài khoản?{' '}
            <Box
              component="span"
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
      </Paper>
    </Box>
  );
}
