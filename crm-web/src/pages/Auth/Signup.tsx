import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Paper,
  Alert,
  Avatar,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { useNavigate } from 'react-router-dom';
import { registerUser } from './../../api/authApi';

export type FormData = {
  username: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  avatar?: FileList; // optional
};

// Schema validation
const schema: yup.ObjectSchema<FormData> = yup.object({
  username: yup.string().required('Vui lòng nhập họ tên'),
  email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  phone: yup.string()
    .required('Vui lòng nhập số điện thoại')
    .matches(/^(0[0-9]{9})$/, 'Số điện thoại phải gồm 10 chữ số hợp lệ'),
  address: yup.string().required('Vui lòng nhập địa chỉ'),
  password: yup.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').required('Vui lòng nhập mật khẩu'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng nhập lại mật khẩu'),
  avatar: yup.mixed<FileList>().optional(),
});

export default function Signup() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
  });

  const avatarFile = watch('avatar');

  // Tạo preview ảnh khi chọn file
  useEffect(() => {
    if (avatarFile && avatarFile.length > 0) {
      const file = avatarFile[0];
      const url = URL.createObjectURL(file);
      setPreview(url);

      return () => URL.revokeObjectURL(url); // cleanup
    } else {
      setPreview(null);
    }
  }, [avatarFile]);

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('');

      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('address', data.address);
      formData.append('password', data.password);
      formData.append('confirmPassword', data.confirmPassword); // ✅ quan trọng
      if (data.avatar && data.avatar.length > 0) {
        formData.append('avatar', data.avatar[0]);
      }

      // Debug FormData
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      await registerUser(formData);
      navigate('/login');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Đăng ký thất bại.');
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
      }}
    >
      <Paper
        elevation={12}
        sx={{
          height: '100vh',
          width: '100%',
          maxWidth: 420,
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
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={3}>
            Đăng ký
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Avatar upload */}
            <Box textAlign="center" mb={2}>
              <Avatar
                src={preview || ''}
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 1,
                  border: '2px solid #4f46e5',
                }}
              />
              <Button variant="outlined" component="label">
                Chọn ảnh
                <input type="file" hidden accept="image/*" {...register('avatar')} />
              </Button>
              {errors.avatar && (
                <Typography variant="body2" color="error" mt={0.5}>
                  {errors.avatar.message}
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              label="Họ tên"
              margin="normal"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email"
              margin="normal"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
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
              label="Số điện thoại"
              margin="normal"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneAndroidIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Địa chỉ"
              margin="normal"
              {...register('address')}
              error={!!errors.address}
              helperText={errors.address?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HomeOutlinedIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Mật khẩu"
              type="password"
              margin="normal"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Xác nhận mật khẩu"
              type="password"
              margin="normal"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {serverError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {serverError}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
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
              {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>

            <Typography variant="body2" textAlign="center" mt={3} color="textSecondary">
              Đã có tài khoản?{' '}
              <Box
                component="span"
                sx={{
                  color: 'primary.main',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => navigate('/login')}
              >
                Đăng nhập
              </Box>
            </Typography>
          </form>
        </Box>
      </Paper>
    </Box>
  );
}
