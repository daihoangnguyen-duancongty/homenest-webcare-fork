import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: 'admin' | 'telesale' | 'user';
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}
