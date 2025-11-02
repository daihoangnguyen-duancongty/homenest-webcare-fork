import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import AdminDashboard from './pages/AdminDashboard';
import TelesaleDashboard from './pages/TelesaleDashboard';
import { getCurrentUser } from './utils/auth';
import ProtectRoute from './routes/ProtectRoute'; // ProtectRoute
import { useSocketStore } from './store/socketStore';

function App() {
  const user = getCurrentUser();
  const { initSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    initSocket();
    // return () => disconnectSocket();
  }, []);

  const getHomeRedirect = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'telesale') return <Navigate to="/telesale" replace />;
    return <Navigate to="/login" replace />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={getHomeRedirect()} />

        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* ✅ Chỉ admin mới vào được */}
        <Route
          path="/admin"
          element={
            <ProtectRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectRoute>
          }
        />

        {/* ✅ Chỉ telesale mới vào được */}
        <Route
          path="/telesale"
          element={
            <ProtectRoute allowedRoles={['telesale']}>
              <TelesaleDashboard />
            </ProtectRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
