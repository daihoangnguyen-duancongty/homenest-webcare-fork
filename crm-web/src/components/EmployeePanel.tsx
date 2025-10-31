import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  CircularProgress,
  IconButton,
  Alert,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/authApi';
import type { Employee } from '../api/authApi';
import { useNavigate } from 'react-router-dom';


interface EmployeePanelProps {

  sx?: any;
}



export default function EmployeePanel({ sx }: EmployeePanelProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    setServerError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không có token');

      const data = await getEmployees(token);

      setEmployees(data);
    } catch (err: any) {
      console.error('Lỗi khi load nhân viên:', err);
      setServerError(err.response?.data?.message || 'Không thể tải danh sách nhân viên.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (emp?: Employee) => {
    if (emp) {
      setEditingEmployee(emp);
      setFormData({
        username: emp.username,
        email: emp.email,
        phone: emp.phone,
        address: emp.address,
        password: '',
        confirmPassword: '',
      });
      setPreview(emp.avatar || null);
    } else {
      setEditingEmployee(null);
      setFormData({
        username: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
      });
      setPreview(null);
    }
    setAvatarFile(null);
    setOpenDialog(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setServerError('Bạn chưa đăng nhập.');
      return;
    }

    const fData = new FormData();
    Object.entries(formData).forEach(([key, value]) => fData.append(key, value));
    if (avatarFile) fData.append('avatar', avatarFile);

    try {
      setServerError(null);
      if (editingEmployee) {
        await updateEmployee(editingEmployee._id, fData, token);
      } else {
        await createEmployee(fData, token);
      }
      setOpenDialog(false);
      loadEmployees();
    } catch (err: any) {
      console.error('Lỗi lưu nhân viên:', err);
      setServerError(err.response?.data?.message || 'Không thể lưu nhân viên.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Không có token');
      await deleteEmployee(id, token);
      loadEmployees();
    } catch (err: any) {
      console.error(err);
      setServerError(err.response?.data?.message || 'Không thể xóa nhân viên.');
    }
  };

  return (
    <Box
      sx={{
        p: isMobile ? 6.4 : 4,
        width: '100%',
        maxWidth: '74vw',
        mx: '0vw',
        my: '6vh',
         ...sx
      }}
     
    >
      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(90deg, #2196F3, #21CBF3)',
            color: '#fff',
            px: isMobile ? 2 : 3,
            py: isMobile ? 1 : 1.2,
            fontSize: isMobile ? '0.8rem' : '1rem',
            borderRadius: 2,
            '&:hover': {
              background: 'linear-gradient(90deg, #1976D2, #00BCD4)',
            },
          }}
        >
          + Thêm nhân viên
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflowX: 'auto',
          }}
        >
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ background: 'linear-gradient(90deg, #2196F3, #21CBF3)' }}>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Ảnh</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Tên nhân viên</TableCell>
                {!isMobile && (
                  <>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Số điện thoại</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Địa chỉ</TableCell>
                  </>
                )}
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp._id} hover>
                  <TableCell>
                    <Avatar
                      src={emp.avatar || ''}
                      alt={emp.username}
                      sx={{ width: 40, height: 40 }}
                    />
                  </TableCell>
                  <TableCell>{emp.username}</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{emp.phone}</TableCell>
                      <TableCell>{emp.address}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(emp)}>
                      <EditIcon sx={{ color: 'green' }} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(emp._id)}>
                      <DeleteIcon sx={{ color: 'red' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ✅ Dialog thêm/sửa nhân viên */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          {editingEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Họ tên"
            fullWidth
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            label="Số điện thoại"
            fullWidth
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <TextField
            label="Địa chỉ"
            fullWidth
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <TextField
            label="Mật khẩu"
            type="password"
            fullWidth
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <TextField
            label="Xác nhận mật khẩu"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
            {preview && <Avatar src={preview} sx={{ width: 80, height: 80, mb: 1 }} />}
            <Button variant="outlined" component="label">
              {avatarFile ? 'Thay ảnh khác' : 'Chọn ảnh đại diện'}
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingEmployee ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
