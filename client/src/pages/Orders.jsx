import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOrders, cancelOrder, rateOrder, requestReturn, reorder as reorderAPI } from '../services/api';
import OrderTimeline from '../components/OrderTimeline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const TOAST_DARK = { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } };

const statusColors = {
  'Placed': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Confirmed': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Packed': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Dispatched': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'Out for Delivery': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Delivered': 'text-green-400 bg-green-500/10 border-green-500/20',
  'Cancelled': 'text-red-400 bg-red-500/10 border-red-500/20',
};
const STATUS_PROGRESS = {
  'Placed': 10, 'Confirmed': 25, 'Packed': 50, 'Dispatched': 65,
  'Out for Delivery': 85, 'Delivered': 100, 'Cancelled': 0,
};
const FILTER_TABS = ['All', 'Active', 'Delivered', 'Cancelled'];

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${statusColors[status] || 'text-slate-400 border-slate-700'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function DeliveryProgress({ status }) {
  const pct = STATUS_PROGRESS[status] || 0;
  const isCancelled = status === 'Cancelled';
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-slate-500 text-xs">Delivery Progress</span>
        <span className={`text-xs font-semibold ${isCancelled ? 'text-red-400' : status === 'Delivered' ? 'text-green-400' : 'text-blue-400'}`}>
          {isCancelled ? 'Cancelled' : `${pct}%`}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${isCancelled ? 'bg-red-500' : status === 'Delivered' ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-blue-400'}`} />
      </div>
    </div>
  );
}

function RatingModal({ order, onClose, onRated }) {
  const [productRating, setProductRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await rateOrder(order._id, { productRating, riderRating, ratingReview: review });
      toast.success('Rating submitted!', TOAST_DARK);
      onRated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating', TOAST_DARK);
    } finally { setLoading(false); }
  };

  const StarRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`text-xl transition-all ${n <= value ? 'text-yellow-400' : 'text-slate-700 hover:text-slate-500'}`}>★</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-2xl p-6 w-full max-w-sm border border-white/10" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-4">Rate Your Order</h3>
        <div className="space-y-3 mb-4">
          <StarRow label="Product Quality" value={productRating} onChange={setProductRating} />
          <StarRow label="Delivery Partner" value={riderRating} onChange={setRiderRating} />
        </div>
        <textarea value={review} onChange={e => setReview(e.target.value)} rows={3}
          placeholder="Share your experience..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none mb-4" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 btn-ghost py-2.5 text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !productRating}
            className="flex-1 btn-primary py-2.5 text-sm font-bold disabled:opacity-60">
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [ratingOrder, setRatingOrder] = useState(null);
  const [riderLocations, setRiderLocations] = useState({}); // { orderId: {lat, lng} }
  const { user, isAuthenticated } = useAuth();
  const { joinOrderRoom, socket } = useSocket();
  const navigate = useNavigate();

  const load = useCallback(async (silent = false) => {
    if (!isAuthenticated()) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const res = await getOrders();
      setOrders(res.data.data || []);
    } catch (err) {
      if (!silent) toast.error('Failed to load orders', TOAST_DARK);
    } finally { if (!silent) setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  // Poll every 30s for active orders
  useEffect(() => {
    const activeOrders = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
    if (activeOrders.length === 0) return;

    // Join rooms for active orders
    activeOrders.forEach(o => joinOrderRoom(o._id));

    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, [orders, load, joinOrderRoom]);

  // Listen for live location
  useEffect(() => {
    if (!socket) return;
    const handleLocation = (data) => {
      setRiderLocations(prev => ({ ...prev, [data.orderId || expanded]: data }));
    };
    socket.on('rider:location', handleLocation);
    return () => socket.off('rider:location', handleLocation);
  }, [socket, expanded]);

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await cancelOrder(orderId, { reason: 'Customer requested' });
      toast.success('Order cancelled', TOAST_DARK);
      load(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel', TOAST_DARK); }
  };

  const handleReorder = async (orderId) => {
    try {
      await reorderAPI(orderId);
      toast.success('Items added to cart!', TOAST_DARK);
    } catch (err) { toast.error('Failed to reorder', TOAST_DARK); }
  };

  const handleReturn = async (orderId) => {
    const reason = prompt('Return reason:');
    if (!reason) return;
    try {
      await requestReturn(orderId, { reason });
      toast.success('Return request submitted!', TOAST_DARK);
      load(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed', TOAST_DARK); }
  };

  const filtered = orders.filter(o => {
    const matchTab =
      activeTab === 'All' ||
      (activeTab === 'Active' && !['Delivered', 'Cancelled'].includes(o.status)) ||
      (activeTab === 'Delivered' && o.status === 'Delivered') ||
      (activeTab === 'Cancelled' && o.status === 'Cancelled');
    const matchSearch = !search || o.orderId?.toLowerCase().includes(search.toLowerCase()) || o.customerName?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-white text-2xl font-bold mb-2">Login to view orders</h2>
          <p className="text-slate-400 mb-6">Track your deliveries and order history</p>
          <button onClick={() => navigate('/login')} className="btn-primary">Login →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="pt-20 max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {/* Header */}
        <div className="py-8">
          <h1 className="text-3xl font-bold text-white mb-1">My Orders</h1>
          <p className="text-slate-400 text-sm">{orders.length} orders total</p>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 glass rounded-xl p-1 border border-white/10">
            {FILTER_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search order ID..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-2xl p-5 border border-white/5 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-4 bg-slate-700 rounded w-32" />
                  <div className="h-6 bg-slate-700 rounded-full w-24" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-white font-bold text-xl mb-2">No orders found</p>
            <p className="text-slate-400 text-sm">Your order history will appear here</p>
            <Link to="/shop" className="mt-6 inline-block btn-primary">Shop Now →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <motion.div key={order._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl border border-white/5 overflow-hidden">
                {/* Order header */}
                <div className="flex items-start justify-between p-5 cursor-pointer"
                  onClick={() => setExpanded(expanded === order._id ? null : order._id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white font-bold font-mono text-sm">{order.orderId}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-slate-400 text-xs mt-1.5">
                      {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} • ₹{order.totalAmount?.toLocaleString()} • {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {order.deliveryAddress && (
                      <p className="text-slate-500 text-xs mt-0.5 truncate">📍 {order.deliveryAddress}</p>
                    )}
                    <DeliveryProgress status={order.status} />
                  </div>
                  <motion.span animate={{ rotate: expanded === order._id ? 180 : 0 }} className="text-slate-500 ml-4 flex-shrink-0 mt-1">▾</motion.span>
                </div>
                {/* View Details shortcut */}
                <div className="px-5 pb-3 -mt-2 flex justify-end">
                  <Link to={`/orders/${order._id}`}
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors flex items-center gap-1">
                    View Details →
                  </Link>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {expanded === order._id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-white/5">
                      <div className="p-5 space-y-4">
                        {/* Timeline */}
                        <OrderTimeline status={order.status} animated />

                        {/* Items */}
                        <div className="space-y-2">
                          <p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Order Items</p>
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3">
                              <img src={item.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&q=60'}
                                alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                                <p className="text-slate-400 text-xs">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                              </div>
                              <p className="text-white font-bold text-sm flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>

                        {/* Totals */}
                        <div className="glass rounded-xl p-4 space-y-1.5 text-sm">
                          {order.subtotal > 0 && <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString()}</span></div>}
                          {order.discountAmount > 0 && <div className="flex justify-between text-green-400"><span>Discount ({order.couponCode})</span><span>−₹{order.discountAmount?.toLocaleString()}</span></div>}
                          {order.deliveryCharge >= 0 && <div className="flex justify-between text-slate-400"><span>Delivery {order.totalWeight > 0 && `(${order.totalWeight}kg)`}</span><span className={order.deliveryCharge === 0 ? 'text-green-400' : ''}>{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</span></div>}
                          {order.gstAmount > 0 && <div className="flex justify-between text-slate-400"><span>GST (18%)</span><span>₹{order.gstAmount?.toLocaleString()}</span></div>}
                          <div className="border-t border-white/10 pt-1.5 flex justify-between text-white font-bold"><span>Total</span><span>₹{order.totalAmount?.toLocaleString()}</span></div>
                        </div>

                        {/* Rider info */}
                        {order.assignedRider && (
                          <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm">
                                {order.assignedRider.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-white text-sm font-semibold">{order.assignedRider.name}</p>
                                <p className="text-slate-400 text-xs">{order.assignedRider.vehicleNo} · ⭐ {order.assignedRider.rating}</p>
                              </div>
                            </div>
                            <a href={`tel:${order.assignedRider.phone}`}
                              className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-xl px-3 py-2 text-sm font-medium transition-all">
                              📞 Call
                            </a>
                          </div>
                        )}

                        {/* Live Tracking UI */}
                        {order.status === 'Out for Delivery' && (
                          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 overflow-hidden relative">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                                  className="w-2 h-2 bg-orange-500 rounded-full" />
                                <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">Live Tracking</span>
                              </div>
                              {riderLocations[order._id] && (
                                <span className="text-slate-500 text-[10px] font-mono">
                                  {riderLocations[order._id].lat.toFixed(4)}, {riderLocations[order._id].lng.toFixed(4)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-2xl">🚴</div>
                              <div className="flex-1">
                                <p className="text-white text-sm font-bold">Rider is arriving</p>
                                <p className="text-slate-400 text-xs">Stay near your phone for the delivery OTP</p>
                              </div>
                            </div>
                            {/* Simple animated progress line to simulate movement */}
                            <div className="mt-4 h-1 bg-slate-800 rounded-full overflow-hidden relative">
                              <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                              />
                            </div>
                          </div>
                        )}

                        {/* Return request status */}
                        {order.returnRequest && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                            <p className="text-amber-400 text-sm font-semibold">Return Request: {order.returnRequest.status}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{order.returnRequest.reason}</p>
                          </div>
                        )}

                        {/* Rating submitted */}
                        {order.productRating && (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-400">{'★'.repeat(order.productRating)}</span>
                              <span className="text-slate-400 text-xs">{order.ratingReview}</span>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          {!['Delivered', 'Cancelled'].includes(order.status) && (
                            <button onClick={() => handleCancel(order._id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-all">
                              ✕ Cancel Order
                            </button>
                          )}
                          {order.status === 'Delivered' && !order.productRating && (
                            <button onClick={() => setRatingOrder(order)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-xs font-medium transition-all">
                              ⭐ Rate Order
                            </button>
                          )}
                          {order.status === 'Delivered' && !order.returnRequest && (
                            <button onClick={() => handleReturn(order._id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-medium transition-all">
                              ↩️ Return
                            </button>
                          )}
                          {['Delivered', 'Cancelled'].includes(order.status) && (
                            <button onClick={() => handleReorder(order._id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-medium transition-all">
                              🔄 Reorder
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {ratingOrder && (
        <RatingModal order={ratingOrder} onClose={() => setRatingOrder(null)} onRated={() => load(true)} />
      )}
    </div>
  );
}
