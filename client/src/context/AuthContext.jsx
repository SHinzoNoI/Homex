import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { loginUser, sendOTP, verifyOTP, updateProfile as updateProfileAPI } from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'hx_token';
const USER_KEY = 'hx_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(false);

  // Logout function — clear everything
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('hx_cart');
    localStorage.removeItem('hx_cart_local');
    setToken(null);
    setUser(null);
  }, []);

  // Validate token expiry on mount AND every 60s
  useEffect(() => {
    const checkExpiry = () => {
      const t = localStorage.getItem(TOKEN_KEY);
      if (t) {
        try {
          const decoded = jwtDecode(t);
          if (decoded.exp * 1000 < Date.now()) logout();
        } catch { logout(); }
      }
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [logout]);

  const setAuth = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // Email + Password login (admin/rider)
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      const { token: newToken, user: newUser } = res.data;
      setAuth(newToken, newUser);
      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally { setLoading(false); }
  }, []);

  // OTP: Step 1 — Send OTP
  const sendLoginOTP = useCallback(async (phone) => {
    setLoading(true);
    try {
      const res = await sendOTP({ phone });
      return { success: true, ...res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to send OTP' };
    } finally { setLoading(false); }
  }, []);

  // OTP: Step 2 — Verify OTP
  const verifyLoginOTP = useCallback(async (phone, otp, name) => {
    setLoading(true);
    try {
      const res = await verifyOTP({ phone, otp, name });
      const { token: newToken, user: newUser } = res.data;
      setAuth(newToken, newUser);
      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Invalid OTP' };
    } finally { setLoading(false); }
  }, []);

  const updateUser = useCallback(async (data) => {
    try {
      const res = await updateProfileAPI(data);
      const newUser = res.data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    }
  }, []);


  const isAdmin = () => user?.role === 'admin';
  const isRider = () => user?.role === 'rider';
  const isAuthenticated = () => !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, sendLoginOTP, verifyLoginOTP, updateUser, logout,
      isAdmin, isRider, isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
