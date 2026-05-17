import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken, clearAuthToken } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const getToken = () => localStorage.getItem('token');

  const normalizeUser = (payload) => {
    if (!payload) return null;
    return {
      id: payload.id || payload.userId || payload.idUser || null,
      email: payload.email || payload.userEmail || '',
      fullName: payload.fullName || payload.name || payload.username || payload.email || '',
      role: payload.role || payload.roleName || payload.roles?.[0] || 'User',
      ...payload,
    };
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/profile');
      const payload = response.data?.data || response.data || {};
      const normalized = normalizeUser(payload);
      setUser(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
      return normalized;
    } catch (error) {
      clearAuthToken();
      localStorage.removeItem('user');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        setAuthToken(token);
        await fetchCurrentUser();
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    setAuthLoading(true);
    try {
      const response = await api.post('/auth/login', credentials);
      const token = response.data?.accessToken || response.data?.token || response.data?.access_token;
      if (!token) {
        throw new Error('Không nhận được token từ server');
      }
      setAuthToken(token);
      const authUser = await fetchCurrentUser();
      return { token, user: authUser };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      clearAuthToken();
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const refreshUser = async () => fetchCurrentUser();

  const isAdmin = user?.role === 'Admin';

  

  const value = useMemo(
    () => ({
      user,
      loading,
      authLoading,
      login,
      logout,
      refreshUser,
      isAdmin,
    }),
    [user, loading, authLoading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
