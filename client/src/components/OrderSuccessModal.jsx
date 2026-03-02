import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import OrderTimeline from './OrderTimeline';

const payColors = {
    COD: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    Paid: 'text-green-400  bg-green-500/10  border-green-500/30',
    Pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    Failed: 'text-red-400    bg-red-500/10    border-red-500/30',
};

export default function OrderSuccessModal({ order, onClose }) {
    const navigate = useNavigate();
    if (!order) return null;

    const handleTrack = () => {
        onClose();
        navigate(`/orders/${order._id}`);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.85, opacity: 0, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-md glass rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20"
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-blue-600/30 to-purple-600/20 p-8 text-center border-b border-white/10">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="orb w-48 h-48 bg-blue-500 top-0 left-1/2 -translate-x-1/2 opacity-20" />
                        </div>
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                            className="relative z-10 w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/40"
                        >
                            <motion.svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <motion.path
                                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"
                                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                    transition={{ delay: 0.4, duration: 0.5 }}
                                />
                            </motion.svg>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-10">
                            <h2 className="text-white font-bold text-2xl mb-1">Order Placed! 🎉</h2>
                            <p className="text-slate-300 text-sm">Your materials are being prepared</p>
                        </motion.div>
                    </div>

                    {/* Order Info */}
                    <div className="p-6 space-y-4">
                        {/* Order ID + Total */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                            className="flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/10"
                        >
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Order ID</p>
                                <p className="text-blue-400 font-mono font-bold text-base">{order.orderId}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs mb-1">Total</p>
                                <p className="text-white font-bold text-lg">Rs.{order.totalAmount?.toLocaleString()}</p>
                            </div>
                        </motion.div>

                        {/* Payment + ETA */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                            className="flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/10"
                        >
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Payment</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${payColors[order.paymentStatus] || 'text-slate-400 bg-slate-500/10 border-slate-500/30'}`}>
                                    {order.paymentStatus}
                                </span>
                                <p className="text-slate-500 text-xs mt-0.5">{order.paymentMethod}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs mb-1">Delivery ETA</p>
                                <p className="text-green-400 font-bold">45 Minutes</p>
                            </div>
                        </motion.div>

                        {/* Timeline */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                            className="bg-white/3 rounded-2xl p-4 border border-white/5"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="w-2 h-2 bg-green-400 rounded-full" />
                                <p className="text-white font-semibold text-sm">Order Status</p>
                            </div>
                            <OrderTimeline status={order.status || 'Placed'} animated={false} />
                        </motion.div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                            <button onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">
                                Close
                            </button>
                            <motion.button whileTap={{ scale: 0.98 }} onClick={handleTrack}
                                className="flex-1 btn-primary py-3 text-sm font-bold">
                                Track Order
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
