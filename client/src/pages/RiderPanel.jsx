import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrders, updateOrderStatus as updateOrder, getRiderStats, updateRider, verifyDeliveryOTP, selfAssignOrder } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import OrderTimeline from '../components/OrderTimeline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const TOAST_DARK = { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } };

const nextStatus = {
  'Placed': 'Confirmed',
  'Confirmed': 'Packed',
  'Packed': 'Dispatched',
  'Dispatched': 'Out for Delivery',
};
const nextLabel = {
  'Placed': 'Confirm Order',
  'Confirmed': 'Mark Packed',
  'Packed': 'Mark Dispatched',
  'Dispatched': 'Out for Delivery',
  'Out for Delivery': 'Confirm Delivery (OTP)',
};

const statusColors = {
  'Placed': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Confirmed': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Packed': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Dispatched': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'Out for Delivery': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Delivered': 'text-green-400 bg-green-500/10 border-green-500/20',
  'Cancelled': 'text-red-400 bg-red-500/10 border-red-500/20',
};
const DELIVERY_RATE = 120;

function DeliveryTimer({ createdAt }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(createdAt).getTime() + 45 * 60 * 1000 - Date.now();
      if (diff <= 0) { setRemaining('Overdue'); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}m ${secs}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [createdAt]);
  const isOverdue = remaining === 'Overdue';
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${isOverdue ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20'}`}>
      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}
        className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-red-400' : 'bg-green-400'}`} />
      {isOverdue ? '⚠ Overdue' : `⏱ ETA: ${remaining}`}
    </div>
  );
}

function OTPModal({ order, onConfirmed, onClose }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP', TOAST_DARK); return; }
    setLoading(true);
    try {
      await verifyDeliveryOTP(order._id, { otp });
      toast.success('🎉 Delivery confirmed!', TOAST_DARK);
      onConfirmed();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP', TOAST_DARK);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-2xl p-6 w-full max-w-sm border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">🔐</div>
          <h3 className="text-white font-bold text-lg">Delivery OTP Verification</h3>
          <p className="text-slate-400 text-sm mt-1">Ask customer for the 6-digit OTP</p>
          <p className="text-slate-500 text-xs mt-0.5">Order: {order.orderId}</p>
        </div>
        <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="• • • • • •"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-2xl font-bold tracking-widest text-center focus:outline-none focus:border-green-500 mb-4"
          maxLength={6} autoFocus />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 btn-ghost py-3 text-sm">Cancel</button>
          <button onClick={handleVerify} disabled={loading || otp.length < 6}
            className="flex-1 btn-success py-3 text-sm font-bold disabled:opacity-60">
            {loading ? 'Verifying...' : '✓ Confirm Delivery'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function RiderPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riderInfo, setRiderInfo] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [otpOrder, setOtpOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('Active');
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getOrders();
      const allOrders = res.data.data || [];
      setOrders(allOrders);

      // Load this rider's own profile directly using riderId
      if (user?.riderId) {
        try {
          const riderRes = await getRiderStats(user.riderId);
          if (riderRes.data?.data) setRiderInfo(riderRes.data.data);
        } catch (_) { /* rider stats are non-critical */ }
      }
    } catch (err) { if (!silent) console.error(err); }
    finally { if (!silent) setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    // Poll orders every 30s (was 5s — caused 429 rate limit cascade)
    const pollInterval = setInterval(() => load(true), 30000);

    // Emit GPS location every 10s only when actively delivering
    const gpsInterval = setInterval(() => {
      const trackingOrder = orders.find(o => o.status === 'Out for Delivery');
      if (trackingOrder && socket && user?.riderId) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              socket.emit('rider:location', {
                orderId: trackingOrder._id,
                riderId: user.riderId,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            },
            () => { /* geolocation denied — skip silently */ }
          );
        }
      }
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(gpsInterval);
    };
  }, [load, orders, socket, user]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await updateOrder(orderId, { status: newStatus });
      toast.success(`Status → ${newStatus}`, TOAST_DARK);
      load(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed', TOAST_DARK); }
    finally { setUpdating(null); }
  };

  const handleAcceptOrder = async (orderId) => {
    setUpdating(orderId);
    try {
      await selfAssignOrder(orderId);
      toast.success('Order accepted!', TOAST_DARK);
      load(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to accept', TOAST_DARK); }
    finally { setUpdating(null); }
  };

  const handleOTPConfirmed = () => {
    setOtpOrder(null);
    load(true);
  };

  // Filter: my assigned orders + unassigned 'Placed' orders (available to accept)
  const myOrders = orders.filter(o => {
    const isMyOrder = user?.riderId && o.assignedRider &&
      (typeof o.assignedRider === 'string' ? o.assignedRider === user.riderId : o.assignedRider._id === user.riderId);
    const isUnassigned = !o.assignedRider && o.status === 'Placed';
    return isMyOrder || isUnassigned || user?.role === 'admin';
  });

  const activeOrders = myOrders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
  const unassignedOrders = myOrders.filter(o => !o.assignedRider && o.status === 'Placed');
  const historyOrders = myOrders.filter(o => ['Delivered', 'Cancelled'].includes(o.status));
  const deliveredToday = myOrders.filter(o => o.status === 'Delivered' && new Date(o.updatedAt) > new Date(Date.now() - 86400000));
  const todayEarnings = deliveredToday.length * DELIVERY_RATE;

  const displayOrders = activeTab === 'Active' ? activeOrders : activeTab === 'Available' ? unassignedOrders : historyOrders;

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading rider panel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] pb-16">
      {/* Header */}
      <div className="glass border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center text-white font-bold">🚚</div>
            <div>
              <p className="text-white font-bold text-sm">Rider Panel</p>
              <p className="text-slate-400 text-xs">{riderInfo?.name || user?.name || 'Delivery Partner'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-green-400 text-xs font-semibold mr-2">Online</span>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-xs border border-red-500/20 rounded-lg px-2 py-1">Logout</button>
            <Link to="/" className="text-slate-400 hover:text-white text-xs border border-slate-700 rounded-lg px-2 py-1">Exit</Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Orders', value: activeOrders.length, icon: '📦', color: 'text-blue-400' },
            { label: 'Available', value: unassignedOrders.length, icon: '🆕', color: 'text-cyan-400' },
            { label: 'Today Delivered', value: deliveredToday.length, icon: '✅', color: 'text-green-400' },
            { label: "Today's Earnings", value: `₹${todayEarnings}`, icon: '💰', color: 'text-yellow-400' },
            { label: 'Total Deliveries', value: riderInfo?.totalDeliveries || 0, icon: '🏆', color: 'text-purple-400' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-4 border border-white/5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-slate-500 text-xs mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 glass rounded-xl p-1 border border-white/10">
          {['Active', 'Available', 'History'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {tab} ({tab === 'Active' ? activeOrders.length : tab === 'Available' ? unassignedOrders.length : historyOrders.length})
            </button>
          ))}
        </div>

        {/* Orders */}
        {displayOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">{activeTab === 'Active' ? '☕' : '📭'}</div>
            <p className="text-white font-bold text-xl mb-2">{activeTab === 'Active' ? 'No active orders' : 'No history yet'}</p>
            <p className="text-slate-400 text-sm">{activeTab === 'Active' ? 'Orders will appear here when assigned' : 'Delivered orders will show here'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map(order => (
              <motion.div key={order._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === order._id ? null : order._id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold font-mono text-sm">{order.orderId}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[order.status]}`}>{order.status}</span>
                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                          <DeliveryTimer createdAt={order.createdAt} />
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-1">
                        {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} • ₹{order.totalAmount?.toLocaleString()} • {order.paymentMethod}
                      </p>
                      {order.deliveryAddress && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate">📍 {order.deliveryAddress}</p>
                      )}
                    </div>
                    <motion.span animate={{ rotate: expanded === order._id ? 180 : 0 }} className="text-slate-500 flex-shrink-0">▾</motion.span>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === order._id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-white/5">
                      <div className="p-4 space-y-4">
                        <OrderTimeline status={order.status} />

                        {/* Customer info */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 space-y-1">
                          <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide">Customer</p>
                          <p className="text-white text-sm font-semibold">{order.customerName}</p>
                          {order.customerPhone && (
                            <a href={`tel:${order.customerPhone}`}
                              className="inline-flex items-center gap-2 text-green-400 text-sm">
                              📞 {order.customerPhone}
                            </a>
                          )}
                          {order.deliveryAddress && <p className="text-slate-400 text-xs">📍 {order.deliveryAddress}</p>}
                          {order.notes && <p className="text-slate-400 text-xs">💬 {order.notes}</p>}
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-slate-500">×{item.quantity}</span>
                              <span className="text-white">{item.name}</span>
                              <span className="text-slate-400 ml-auto">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        {activeTab !== 'History' && !['Delivered', 'Cancelled'].includes(order.status) && (
                          <div className="flex gap-2">
                            {/* Accept unassigned order */}
                            {!order.assignedRider && order.status === 'Placed' ? (
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => handleAcceptOrder(order._id)}
                                disabled={updating === order._id}
                                className="flex-1 btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 bg-green-600 hover:bg-green-700">
                                {updating === order._id ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : null}
                                ✅ Accept Order
                              </motion.button>
                            ) : order.status === 'Out for Delivery' ? (
                              <button onClick={() => setOtpOrder(order)}
                                className="flex-1 btn-success py-3 text-sm font-bold flex items-center justify-center gap-2">
                                🔐 Verify OTP & Deliver
                              </button>
                            ) : nextStatus[order.status] ? (
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => handleStatusUpdate(order._id, nextStatus[order.status])}
                                disabled={updating === order._id}
                                className="flex-1 btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                                {updating === order._id ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : null}
                                {nextLabel[order.status] || 'Update Status'}
                              </motion.button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {otpOrder && <OTPModal order={otpOrder} onConfirmed={handleOTPConfirmed} onClose={() => setOtpOrder(null)} />}
    </div>
  );
}
