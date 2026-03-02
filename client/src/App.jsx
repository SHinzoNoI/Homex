import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import Landing from './pages/Landing';
import Shop from './pages/Shop';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import AdminDashboard from './pages/AdminDashboard';
import RiderPanel from './pages/RiderPanel';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

// Redirect authenticated users away from /login
function LoginGuard({ children }) {
  const { user, token } = useAuth();
  if (token && user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'rider') return <Navigate to="/rider" replace />;
    return <Navigate to="/shop" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <BrowserRouter>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' },
                }}
              />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/login" element={<LoginGuard><Login /></LoginGuard>} />

                <Route path="/orders" element={
                  <ProtectedRoute>
                    <ErrorBoundary><Orders /></ErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/orders/:id" element={
                  <ProtectedRoute>
                    <ErrorBoundary><OrderDetail /></ErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/admin/*" element={
                  <ProtectedRoute requiredRole="admin">
                    <ErrorBoundary><AdminDashboard /></ErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/rider" element={
                  <ProtectedRoute requiredRole={['admin', 'rider']}>
                    <ErrorBoundary><RiderPanel /></ErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
