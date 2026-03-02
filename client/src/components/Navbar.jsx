import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, setIsOpen } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || !isLanding ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">HX</div>
            <span className="text-white font-bold text-xl tracking-tight">HomeX</span>
            <span className="hidden sm:block text-blue-400 text-xs font-medium bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">45 MIN</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {[{ to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' }, { to: '/orders', label: 'My Orders' }].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === item.to
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold badge-pulse"
                >
                  {count}
                </motion.span>
              )}
            </button>

            <Link to="/admin" className="hidden md:block btn-ghost text-sm px-4 py-2">
              Admin
            </Link>
            {isAuthenticated() ? (
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="hidden md:block text-red-400 hover:text-red-300 text-sm font-medium px-4 py-2"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="hidden md:block btn-ghost text-sm px-4 py-2">
                Login
              </Link>
            )}
            <Link to="/shop" className="btn-primary text-sm px-4 py-2">
              Order Now
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/5"
          >
            <div className="px-4 py-3 space-y-1">
              {[{ to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' }, { to: '/orders', label: 'My Orders' }, { to: '/admin', label: 'Admin' }, { to: '/rider', label: 'Rider Panel' }].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/5 text-sm"
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated() && (
                <button
                  onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
                  className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-white/5 text-sm"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
