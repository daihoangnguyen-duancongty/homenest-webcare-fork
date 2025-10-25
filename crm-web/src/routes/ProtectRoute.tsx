// src/routes/ProtectRoute.tsx
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

interface ProtectRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
}

export default function ProtectRoute({ children, allowedRoles }: ProtectRouteProps) {
  const user = getCurrentUser();

  // ❌ Nếu chưa đăng nhập → quay về trang login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ⚠️ Nếu có role nhưng không đúng quyền → quay về trang login
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Nếu hợp lệ → cho phép vào
  return children;
}
