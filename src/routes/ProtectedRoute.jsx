import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="loading-screen">Đang kiểm tra quyền truy cập...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'Admin' && !isAdmin) {
    return <Navigate to="/products" replace />;
  }

  return children;
}
