import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TOAST_STYLE = { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } };

export default function Login() {
  const [mode, setMode] = useState('otp'); // 'otp' | 'email'
  // OTP flow states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOTP, setDevOTP] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  // Email flow states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const { login, sendLoginOTP, verifyLoginOTP, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const checkoutRedirect = location.state?.checkoutRedirect || false;

  const startResendTimer = () => {
    setResendTimer(30);
    const t = setInterval(() => {
      setResendTimer(s => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone || phone.replace(/\s/g, '').length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    const result = await sendLoginOTP(phone.replace(/\s/g, ''));
    if (result.success) {
      setOtpSent(true);
      if (result.otp) setDevOTP(result.otp); // Dev mode only
      startResendTimer();
      toast.success('OTP sent!', TOAST_STYLE);
    } else {
      setError(result.message);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    const result = await verifyLoginOTP(phone.replace(/\s/g, ''), otp, name);
    if (result.success) {
      toast.success('Welcome to HomeX!', TOAST_STYLE);
      if (result.user.role === 'admin') navigate('/admin', { replace: true });
      else if (result.user.role === 'rider') navigate('/rider', { replace: true });
      else {
        if (checkoutRedirect) localStorage.setItem('hx_reopen_cart', '1');
        navigate(from, { replace: true });
      }
    } else {
      setError(result.message);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      toast.success('Welcome back!', TOAST_STYLE);
      if (result.user.role === 'admin') navigate('/admin', { replace: true });
      else if (result.user.role === 'rider') navigate('/rider', { replace: true });
      else {
        if (checkoutRedirect) localStorage.setItem('hx_reopen_cart', '1');
        navigate(from, { replace: true });
      }
    } else {
      setError(result.message);
    }
  };



  const inputClass = "w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors";

  return (
    <div className="min-h-screen bg-[#020617] bg-mesh flex items-center justify-center p-4">
      <div className="orb w-96 h-96 bg-blue-600 top-0 -left-32 opacity-10" />
      <div className="orb w-64 h-64 bg-purple-700 bottom-10 -right-16 opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-white font-bold text-2xl">HomeX</span>
          </a>
          <h1 className="text-white text-2xl font-bold">
            {mode === 'otp' ? (otpSent ? 'Enter OTP' : 'Login with Mobile') : 'Staff Login'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'otp'
              ? (otpSent ? `OTP sent to +91 ${phone}` : 'Get OTP on your mobile')
              : 'Admin & Rider access only'
            }
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6 glass rounded-xl p-1 border border-white/10">
          <button
            onClick={() => { setMode('otp'); setError(''); setOtpSent(false); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'otp' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >📱 OTP Login</button>
          <button
            onClick={() => { setMode('email'); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'email' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >👑 Staff Login</button>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10">
          <AnimatePresence mode="wait">
            {mode === 'otp' ? (
              <motion.div key="otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                {!otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                      <label className="text-slate-400 text-xs font-medium block mb-1.5">Mobile Number</label>
                      <div className="flex gap-2">
                        <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 text-slate-400 text-sm">+91</div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="98765 43210"
                          className={`${inputClass} flex-1`}
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-2.5">
                        ⚠️ {error}
                      </motion.div>
                    )}
                    <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                      className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-60">
                      {loading ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Sending...</> : 'Send OTP →'}
                    </motion.button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    {devOTP && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-center">
                        <p className="text-amber-400 text-xs font-medium">Demo OTP</p>
                        <p className="text-amber-300 font-bold text-2xl tracking-widest mt-1">{devOTP}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-slate-400 text-xs font-medium block mb-1.5">6-Digit OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="• • • • • •"
                        className={`${inputClass} text-center text-2xl tracking-widest font-bold`}
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-medium block mb-1.5">Your Name <span className="text-slate-600">(if new user)</span></label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="e.g. Rajesh Kumar" className={inputClass} />
                    </div>
                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-2.5">
                        ⚠️ {error}
                      </motion.div>
                    )}
                    <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading || otp.length < 6}
                      className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-60">
                      {loading ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Verifying...</> : 'Verify & Login →'}
                    </motion.button>
                    <div className="flex items-center justify-between text-xs">
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                        className="text-slate-500 hover:text-blue-400 transition-colors">← Change number</button>
                      <button type="button" onClick={handleSendOTP} disabled={resendTimer > 0}
                        className="text-slate-500 hover:text-blue-400 disabled:text-slate-700 transition-colors">
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-xs font-medium block mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="admin@homex.in" required className={inputClass} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-medium block mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" required className={`${inputClass} pr-10`} />
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm">
                        {showPw ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-2.5">
                      ⚠️ {error}
                    </motion.div>
                  )}
                  <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                    className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Signing in...</> : 'Sign In →'}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 text-center">
            <a href="/shop" className="text-slate-500 hover:text-blue-400 text-xs transition-colors">
              Continue as guest → Shop
            </a>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          🔒 Secured with JWT · HomeX v2.0
        </p>
      </motion.div>
    </div>
  );
}
