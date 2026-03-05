import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import OrderTimeline from '../components/OrderTimeline';
import { getOrder } from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const TOAST_DARK = { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } };

const statusColors = {
    Placed: 'text-yellow-400  bg-yellow-500/10  border-yellow-500/30',
    Confirmed: 'text-blue-400    bg-blue-500/10    border-blue-500/30',
    Packed: 'text-purple-400  bg-purple-500/10  border-purple-500/30',
    Dispatched: 'text-indigo-400  bg-indigo-500/10  border-indigo-500/30',
    'Out for Delivery': 'text-orange-400 bg-orange-500/10  border-orange-500/30',
    Delivered: 'text-green-400   bg-green-500/10   border-green-500/30',
    Cancelled: 'text-red-400     bg-red-500/10     border-red-500/30',
};
const payColors = {
    COD: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    Paid: 'text-green-400  bg-green-500/10  border-green-500/30',
    Pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    Failed: 'text-red-400    bg-red-500/10    border-red-500/30',
    Refunded: 'text-blue-400   bg-blue-500/10   border-blue-500/30',
};

function Badge({ label, colors }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors}`}>
            {label}
        </span>
    );
}

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [riderLocation, setRiderLocation] = useState(null);
    const { socket, joinOrderRoom } = useSocket();

    useEffect(() => {
        async function load() {
            try {
                const res = await getOrder(id);
                setOrder(res.data.data);
            } catch (err) {
                toast.error('Order not found', TOAST_DARK);
                navigate('/orders');
            } finally { setLoading(false); }
        }
        load();
    }, [id, navigate]);

    // Join socket room + listen for updates and live location
    useEffect(() => {
        if (!order || !socket) return;
        joinOrderRoom(order._id);
        const onUpdate = (data) => {
            setOrder(prev => prev ? { ...prev, status: data.status } : prev);
        };
        const onLocation = (data) => {
            if (String(data.orderId) === String(order._id)) {
                setRiderLocation({ lat: data.lat, lng: data.lng });
            }
        };
        socket.on('order:update', onUpdate);
        socket.on('rider:location', onLocation);
        return () => {
            socket.off('order:update', onUpdate);
            socket.off('rider:location', onLocation);
        };
    }, [order, socket, joinOrderRoom]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617]">
                <Navbar />
                <div className="pt-28 max-w-2xl mx-auto px-4 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass rounded-2xl p-5 border border-white/5 animate-pulse h-24" />
                    ))}
                </div>
            </div>
        );
    }

    if (!order) return null;

    const isOutForDelivery = order.status === 'Out for Delivery';

    return (
        <div className="min-h-screen bg-[#020617]">
            <Navbar />
            <div className="pt-20 max-w-2xl mx-auto px-4 sm:px-6 pb-16">
                {/* Header */}
                <div className="py-8">
                    <button onClick={() => navigate('/orders')}
                        className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors">
                        ← Back to Orders
                    </button>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-white font-mono">{order.orderId}</h1>
                            <p className="text-slate-400 text-sm mt-1">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Badge label={order.status} colors={statusColors[order.status] || ''} />
                            <Badge label={order.paymentStatus} colors={payColors[order.paymentStatus] || ''} />
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Status Timeline */}
                    <div className="glass rounded-2xl p-5 border border-white/5">
                        <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Delivery Progress</h2>
                        <OrderTimeline status={order.status} animated />
                    </div>

                    {/* Live Tracking (only when Out for Delivery) */}
                    {isOutForDelivery && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="glass rounded-2xl p-5 border border-orange-500/20 bg-orange-500/5">
                            <div className="flex items-center gap-2 mb-3">
                                <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                                    className="w-2.5 h-2.5 bg-orange-400 rounded-full" />
                                <h2 className="text-orange-400 font-bold text-sm">🚚 Out for Delivery — Live</h2>
                            </div>
                            {riderLocation ? (
                                <div className="bg-slate-800/60 rounded-xl p-3 text-sm">
                                    <p className="text-slate-400 text-xs mb-2">Rider Location</p>
                                    <p className="text-white font-mono text-xs">
                                        {riderLocation.lat.toFixed(5)}, {riderLocation.lng.toFixed(5)}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-1">Updates every 5 seconds</p>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">Waiting for rider location signal...</p>
                            )}
                            {/* Rider info */}
                            {order.assignedRider && (
                                <div className="flex items-center gap-3 mt-3 bg-slate-800/40 rounded-xl p-3">
                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {order.assignedRider.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-semibold">{order.assignedRider.name}</p>
                                        <p className="text-slate-400 text-xs">{order.assignedRider.vehicleNo} · ⭐ {order.assignedRider.rating}</p>
                                    </div>
                                    {order.assignedRider.phone && (
                                        <a href={`tel:${order.assignedRider.phone}`}
                                            className="text-green-400 text-sm bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl px-3 py-2 transition-colors">
                                            📞 Call
                                        </a>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Rider assigned (non-tracking states) */}
                    {!isOutForDelivery && order.assignedRider && !['Delivered', 'Cancelled'].includes(order.status) && (
                        <div className="glass rounded-2xl p-4 border border-white/5">
                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Assigned Rider</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {order.assignedRider.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-white text-sm font-semibold">{order.assignedRider.name}</p>
                                    <p className="text-slate-400 text-xs">{order.assignedRider.vehicleNo}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="glass rounded-2xl p-5 border border-white/5">
                        <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Items Ordered</h2>
                        <div className="space-y-3">
                            {order.items?.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3">
                                    <img src={item.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&q=60'}
                                        alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                                        <p className="text-slate-400 text-xs">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                                    </div>
                                    <p className="text-white font-bold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="glass rounded-2xl p-5 border border-white/5">
                        <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Payment</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString()}</span></div>
                            {order.discountAmount > 0 && (
                                <div className="flex justify-between text-green-400">
                                    <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                                    <span>−₹{order.discountAmount?.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-400">
                                <span>Delivery {order.totalWeight > 0 && `(${order.totalWeight}kg)`}</span>
                                <span className={order.deliveryCharge === 0 ? 'text-green-400' : ''}>
                                    {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                                </span>
                            </div>
                            {order.gstAmount > 0 && (
                                <div className="flex justify-between text-slate-400"><span>GST (18%)</span><span>₹{order.gstAmount?.toLocaleString()}</span></div>
                            )}
                            <div className="border-t border-white/10 pt-2 flex justify-between text-white font-bold text-base">
                                <span>Total</span>
                                <span>₹{order.totalAmount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 pt-1">
                                <span>Payment Method</span>
                                <span className="text-white">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Payment Status</span>
                                <Badge label={order.paymentStatus} colors={payColors[order.paymentStatus] || ''} />
                            </div>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    {order.deliveryAddress && (
                        <div className="glass rounded-2xl p-5 border border-white/5">
                            <h2 className="text-white font-semibold mb-2 text-sm uppercase tracking-wide">Delivery Address</h2>
                            <p className="text-slate-300 text-sm">📍 {order.deliveryAddress}</p>
                            {order.notes && <p className="text-slate-500 text-xs mt-1.5">💬 {order.notes}</p>}
                        </div>
                    )}

                    {/* Status History */}
                    {order.statusHistory?.length > 0 && (
                        <div className="glass rounded-2xl p-5 border border-white/5">
                            <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Status History</h2>
                            <div className="space-y-2">
                                {[...order.statusHistory].reverse().map((h, i) => (
                                    <div key={i} className="flex items-start justify-between gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                            <span className="text-white font-medium">{h.status}</span>
                                            {h.note && <span className="text-slate-500 text-xs">— {h.note}</span>}
                                        </div>
                                        <span className="text-slate-500 text-xs flex-shrink-0">
                                            {new Date(h.changedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Link to="/shop" className="block text-center btn-primary py-3 text-sm font-bold">
                        🛒 Order More Materials
                    </Link>
                </div>
            </div>
        </div>
    );
}
