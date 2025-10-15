import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Auth/Login';
import AdminDashboard from './pages/AdminDashboard';
import TelesaleDashboard from './pages/TelesaleDashboard';
import ProtectedRoute from './layout/ProtectedRoute';
import { getCurrentUser } from './utils/auth';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (() => {
          const user = getCurrentUser();
          if (!user) return <Navigate to="/login" />;
          if (user.role === 'admin') return <Navigate to="/admin" />;
          if (user.role === 'telesale') return <Navigate to="/telesale" />;
          return <Navigate to="/login" />;
        })(),
      },
      { path: 'login', element: <Login /> },
      {
        path: 'admin',
        element: (
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'telesale',
        element: (
          <ProtectedRoute role="telesale">
            <TelesaleDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;
