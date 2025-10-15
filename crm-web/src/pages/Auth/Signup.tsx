import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from './../../api/authApi';
import { Box, Button, TextField, Typography, MenuItem, Paper, Alert } from '@mui/material';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'admin' | 'telesale'>('telesale');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await registerUser({ email, password, username, role });
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
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
      <Paper elevation={12} sx={{ p: 6, maxWidth: 420, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.9)' }}>
        <Typography variant="h4" textAlign="center" mb={3} fontWeight="bold">
          Đăng ký tài khoản
        </Typography>

        <form onSubmit={handleSignup}>
          <TextField fullWidth label="Họ tên" value={username} onChange={e => setUsername(e.target.value)} required margin="normal" />
          <TextField fullWidth label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required margin="normal" />
          <TextField fullWidth label="Mật khẩu" type="password" value={password} onChange={e => setPassword(e.target.value)} required margin="normal" />
          <TextField select fullWidth label="Vai trò" value={role} onChange={e => setRole(e.target.value as any)} margin="normal">
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="telesale">Telesale</MenuItem>
          </TextField>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Button fullWidth type="submit" variant="contained" sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}>
            Đăng ký
          </Button>
        </form>

        <Typography textAlign="center" mt={2}>
          Đã có tài khoản?{' '}
          <Box component="span" sx={{ color: 'primary.main', cursor: 'pointer' }} onClick={() => navigate('/login')}>
            Đăng nhập
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
}
