import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, sendOTP, verifyOrderOTP } from '../services/api';
import toast from 'react-hot-toast';
import OrderSuccessModal from './OrderSuccessModal';

const TOAST_DARK = { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } };
const inputClass = 'w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors';

// Checkout steps: 'form' → 'otp' → placing order
export default function CartDrawer() {
  const {
    items, removeItem, updateQty, clearCart,
    total, subtotal, deliveryCharge, gstAmount, discountAmount,
    couponCode, totalWeight, isOpen, setIsOpen, syncing,
    applyCouponCode, removeCouponCode,
  } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [step, setStep] = useState('cart'); // 'cart' | 'form' | 'otp' | 'placing'
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: '' });

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [devOTP, setDevOTP] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const [successOrder, setSuccessOrder] = useState(null);

  // Reopen cart if redirected back from login during checkout
  React.useEffect(() => {
    if (localStorage.getItem('hx_reopen_cart')) {
      localStorage.removeItem('hx_reopen_cart');
      setIsOpen(true);
    }
  }, []);

  const closeAll = () => {
    setIsOpen(false);
    setStep('cart');
    setOtpSent(false);
    setOtpInput('');
    setDevOTP('');
    setVerificationToken(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    if (!isAuthenticated()) { toast.error('Please login to apply coupons', TOAST_DARK); return; }
    setCouponLoading(true);
    const result = await applyCouponCode(couponInput.trim());
    if (result.success) { toast.success(result.message, TOAST_DARK); setCouponInput(''); }
    else toast.error(result.message, TOAST_DARK);
    setCouponLoading(false);
  };

  // Step 1 → Step 2: validate form then go to OTP
  const handleGoToOTP = () => {
    if (!form.name.trim()) { toast.error('Please enter your name', TOAST_DARK); return; }
    if (!form.phone || form.phone.replace(/\s/g, '').length < 10) {
      toast.error('Enter a valid 10-digit mobile number', TOAST_DARK);
      return;
    }
    if (!form.address.trim()) { toast.error('Please enter delivery address', TOAST_DARK); return; }
    setStep('otp');
  };

  // Step 2a: Send OTP to the customer's phone
  const handleSendOTP = async () => {
    const cleanPhone = form.phone.replace(/\s/g, '');
    setOtpLoading(true);
    try {
      const res = await sendOTP({ phone: cleanPhone });
      setOtpSent(true);
      if (res.data.otp) setDevOTP(res.data.otp); // Dev mode only
      toast.success(`OTP sent to ${cleanPhone}`, TOAST_DARK);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP', TOAST_DARK);
    } finally { setOtpLoading(false); }
  };

  // Step 2b: Verify OTP
  const handleVerifyOTP = async () => {
    if (otpInput.length !== 6) { toast.error('Enter the 6-digit OTP', TOAST_DARK); return; }
    setOtpLoading(true);
    try {
      const res = await verifyOrderOTP({ phone: form.phone.replace(/\s/g, ''), otp: otpInput });
      setVerificationToken(res.data.verificationToken);
      toast.success('Phone verified! Placing your order...', TOAST_DARK);
      await handlePlaceOrder(res.data.verificationToken);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP', TOAST_DARK);
    } finally { setOtpLoading(false); }
  };

  // Step 3: Place order (called automatically after OTP verification)
  const handlePlaceOrder = async (token) => {
    setStep('placing');
    try {
      const orderItems = items.map(i => ({
        product: i._id || i.product,
        name: i.name,
        price: i.priceSnapshot || i.price,
        quantity: i.quantity,
        image: i.image || '',
      }));
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const res = await createOrder({
        items: orderItems,
        customerName: form.name,
        customerPhone: form.phone.replace(/\s/g, ''),
        deliveryAddress: form.address,
        couponCode: couponCode || undefined,
        discountAmount: discountAmount || undefined,
        idempotencyKey,
        phoneVerificationToken: token, // passed for server-side audit
      });
      await clearCart();
      closeAll();
      setSuccessOrder(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.', {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #ef4444' },
      });
      setStep('otp');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeAll}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />

            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md glass-dark shadow-2xl shadow-black/50 z-50 flex flex-col border-l border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {step === 'cart' ? 'Your Cart' : step === 'form' ? 'Delivery Details' : step === 'otp' ? 'Verify Phone' : 'Placing Order...'}
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {step === 'cart' && (items.length === 0 ? 'No items' : `${items.length} item${items.length > 1 ? 's' : ''} · Rs.${subtotal.toLocaleString()}`)}
                    {step === 'form' && 'Step 1 of 2 — Fill delivery details'}
                    {step === 'otp' && 'Step 2 of 2 — Verify your mobile number'}
                    {step === 'placing' && 'Confirming your order...'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {syncing && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                  {step !== 'placing' && (
                    <button onClick={closeAll}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-lg">×</button>
                  )}
                </div>
              </div>

              {/* ── CART VIEW ── */}
              {step === 'cart' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <AnimatePresence>
                      {items.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center h-48 text-center">
                          <div className="text-5xl mb-4">🛒</div>
                          <p className="text-slate-300 font-semibold">Cart is empty</p>
                          <p className="text-slate-500 text-sm mt-1">Browse materials and add items</p>
                          <button onClick={() => setIsOpen(false)}
                            className="mt-4 btn-primary text-sm px-6 py-2.5">Browse Shop →</button>
                        </motion.div>
                      ) : (
                        items.map((item) => (
                          <motion.div key={item._id || item.product} layout
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3 glass rounded-xl p-3 border border-white/5">
                            <img src={item.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&q=60'}
                              alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold line-clamp-1">{item.name}</p>
                              <p className="text-blue-400 text-xs font-bold mt-0.5">Rs.{(item.priceSnapshot || item.price).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => updateQty(item._id || item.product, item.quantity - 1)}
                                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm flex items-center justify-center">−</button>
                              <span className="text-white text-sm font-bold w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateQty(item._id || item.product, item.quantity + 1)}
                                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm flex items-center justify-center">+</button>
                              <button onClick={() => removeItem(item._id || item.product)}
                                className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs flex items-center justify-center ml-1">✕</button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>

                  {items.length > 0 && (
                    <div className="border-t border-white/10 p-4 space-y-3">
                      {/* Coupon */}
                      {!couponCode ? (
                        <div className="flex gap-2">
                          <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="COUPON CODE"
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 uppercase font-mono" />
                          <button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput}
                            className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-semibold disabled:opacity-50">
                            {couponLoading ? '...' : 'Apply'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2.5">
                          <span className="text-green-400 text-sm font-semibold font-mono">{couponCode} applied ✓</span>
                          <button onClick={removeCouponCode} className="text-slate-500 hover:text-red-400 text-xs">✕</button>
                        </div>
                      )}

                      {/* Totals */}
                      <div className="glass rounded-xl p-3 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>Rs.{subtotal.toLocaleString()}</span></div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-green-400"><span>Discount</span><span>−Rs.{discountAmount.toLocaleString()}</span></div>
                        )}
                        <div className="flex justify-between text-slate-400">
                          <span>Delivery{totalWeight > 0 ? ` (${totalWeight}kg)` : ''}</span>
                          <span className={deliveryCharge === 0 ? 'text-green-400' : ''}>{deliveryCharge === 0 ? 'FREE' : `Rs.${deliveryCharge}`}</span>
                        </div>
                        <div className="flex justify-between text-slate-400"><span>GST (18%)</span><span>Rs.{gstAmount.toLocaleString()}</span></div>
                        <div className="border-t border-white/10 pt-2 flex justify-between text-white font-bold text-base">
                          <span>Total</span><span>Rs.{total.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl py-2">
                        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-green-400 text-xs font-bold">⚡ Delivered in 45 minutes</span>
                      </div>

                      <motion.button whileTap={{ scale: 0.98 }} onClick={() => {
                        if (!isAuthenticated()) {
                          setIsOpen(false);
                          navigate('/login', { state: { from: { pathname: '/shop' }, checkoutRedirect: true } });
                          return;
                        }
                        setStep('form');
                      }} className="w-full btn-primary py-3.5 font-bold text-base">
                        {isAuthenticated() ? 'Proceed to Checkout →' : '🔐 Login to Checkout →'}
                      </motion.button>
                    </div>
                  )}
                </>
              )}

              {/* ── STEP 1: DELIVERY DETAILS FORM ── */}
              {step === 'form' && (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your Full Name" className={inputClass} />
                  <div>
                    <div className="flex gap-2">
                      <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 text-slate-400 text-sm flex-shrink-0">+91</div>
                      <input value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        placeholder="Mobile Number (for OTP)" type="tel" maxLength={10} className={`${inputClass} flex-1`} />
                    </div>
                    <p className="text-slate-500 text-xs mt-1.5 pl-1">📱 An OTP will be sent to this number to verify your order</p>
                  </div>
                  <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Delivery address / Site location / Landmark..." rows={3}
                    className={`${inputClass} resize-none`} />
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setStep('cart')} className="flex-1 btn-ghost py-3 text-sm">← Back</button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleGoToOTP}
                      className="flex-1 btn-primary py-3 text-sm font-bold">
                      Send Verification OTP →
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: PHONE OTP VERIFICATION ── */}
              {step === 'otp' && (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="glass rounded-2xl p-5 border border-white/10 text-center">
                    <div className="text-4xl mb-3">📱</div>
                    <h3 className="text-white font-bold text-lg mb-1">Verify Your Number</h3>
                    <p className="text-slate-400 text-sm">
                      We'll send a 6-digit OTP to
                      <span className="text-white font-semibold"> +91 {form.phone}</span>
                    </p>
                    <p className="text-slate-500 text-xs mt-1">This confirms you are placing a genuine order</p>
                  </div>

                  {/* Dev OTP display */}
                  {devOTP && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-center">
                      <p className="text-amber-400 text-xs font-medium mb-1">Demo OTP (dev only)</p>
                      <p className="text-amber-300 font-bold text-3xl tracking-widest">{devOTP}</p>
                    </div>
                  )}

                  {!otpSent ? (
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleSendOTP} disabled={otpLoading}
                      className="w-full btn-primary py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                      {otpLoading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Sending...</> : '📤 Send OTP'}
                    </motion.button>
                  ) : (
                    <div className="space-y-3">
                      <input type="text" value={otpInput}
                        onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="• • • • • •" maxLength={6} autoFocus
                        className={`${inputClass} text-center text-2xl tracking-widest font-bold`} />
                      <motion.button whileTap={{ scale: 0.98 }} onClick={handleVerifyOTP}
                        disabled={otpLoading || otpInput.length !== 6}
                        className="w-full btn-primary py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                        {otpLoading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Verifying...</> : '✓ Verify & Place Order'}
                      </motion.button>
                      <button onClick={() => { setOtpSent(false); setOtpInput(''); setDevOTP(''); }}
                        className="w-full text-slate-500 hover:text-slate-300 text-xs text-center py-1 transition-colors">
                        Resend OTP
                      </button>
                    </div>
                  )}

                  <button onClick={() => { setStep('form'); setOtpSent(false); setOtpInput(''); setDevOTP(''); }}
                    className="w-full btn-ghost py-2.5 text-sm">← Back to Details</button>
                </div>
              )}

              {/* ── PLACING ORDER ── */}
              {step === 'placing' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
                  <p className="text-white font-bold text-lg">Placing your order...</p>
                  <p className="text-slate-400 text-sm">Please wait a moment</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {successOrder && (
        <OrderSuccessModal order={successOrder} onClose={() => setSuccessOrder(null)} />
      )}
    </>
  );
}
