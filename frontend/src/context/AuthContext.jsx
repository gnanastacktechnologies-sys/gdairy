import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('gdairy_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('gdairy_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('gdairy_user', JSON.stringify(res.data.data));
          }
        } catch (error) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('Session expired or invalid token');
            logout();
          } else {
            console.warn('Backend connection issue:', error.message);
          }
        }
      }
      setLoading(false);
    };

    checkLoggedInUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success) {
      const userData = res.data.data;
      setUser(userData);
      setToken(userData.token);
      localStorage.setItem('gdairy_token', userData.token);
      localStorage.setItem('gdairy_user', JSON.stringify(userData));
      return userData;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('gdairy_token');
    localStorage.removeItem('gdairy_user');
  };

  const updateUserProfile = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem('gdairy_user', JSON.stringify(merged));
  };

  const [systemDairyName, setSystemDairyName] = useState(() => localStorage.getItem('gdairy_name') || '');

  useEffect(() => {
    fetchSystemDairyName();
  }, []);

  const fetchSystemDairyName = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success && res.data.data.dairyName) {
        setSystemDairyName(res.data.data.dairyName);
        localStorage.setItem('gdairy_name', res.data.data.dairyName);
      }
    } catch (error) {
      // Ignore network errors on init
    }
  };

  const updateSystemDairyName = (newName) => {
    if (newName) {
      const clean = newName.trim();
      setSystemDairyName(clean);
      localStorage.setItem('gdairy_name', clean);
      if (user) {
        setUser((prev) => (prev ? { ...prev, dairyName: clean } : prev));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUserProfile,
        systemDairyName,
        updateSystemDairyName,
        fetchSystemDairyName,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
