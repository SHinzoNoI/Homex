import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getStats } from '../../services/api';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];

export default function AdminReports() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStats().then(r => setStats(r.data.data)).finally(() => setLoading(false));
    }, []);

    const handleDownloadCSV = () => {
        if (!stats?.dailyOrders?.length) return;
        const rows = [['Date', 'Orders', 'Revenue'], ...stats.dailyOrders.map(d => [d._id, d.orders, d.revenue])];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'homex_sales_report.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const statusData = stats ? [
        { name: 'Delivered', value: stats.delivered || 0 },
        { name: 'Active', value: stats.activeOrders || 0 },
        { name: 'Cancelled', value: stats.cancelled || 0 },
    ].filter(d => d.value > 0) : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Sales Reports</h2>
                    <p className="text-slate-400 text-sm">Overview of revenue and order analytics</p>
                </div>
                <button onClick={handleDownloadCSV}
                    className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 hover:text-green-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass rounded-2xl h-28 skeleton" />)
                ) : [
                    { label: 'Total Revenue', value: `₹${(stats?.revenue || 0).toLocaleString()}`, sub: 'All time', color: 'text-green-400' },
                    { label: 'Total Orders', value: stats?.totalOrders || 0, sub: 'All time', color: 'text-blue-400' },
                    { label: "Today's Orders", value: stats?.ordersToday || 0, sub: 'Orders today', color: 'text-purple-400' },
                    { label: 'Active Orders', value: stats?.activeOrders || 0, sub: 'In progress', color: 'text-yellow-400' },
                ].map((kpi, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="glass rounded-2xl p-5 border border-white/5">
                        <p className="text-slate-400 text-xs mb-1">{kpi.label}</p>
                        <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                        <p className="text-slate-600 text-xs mt-1">{kpi.sub}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass rounded-2xl p-6 lg:col-span-2">
                    <h3 className="text-white font-semibold mb-1">Revenue — Last 7 Days</h3>
                    <p className="text-slate-500 text-xs mb-5">Daily revenue trend</p>
                    {stats?.dailyOrders?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={stats.dailyOrders}>
                                <defs>
                                    <linearGradient id="rpRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="_id" stroke="#475569" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                                    formatter={val => [`₹${val.toLocaleString()}`, 'Revenue']} />
                                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#rpRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <div className="h-52 flex items-center justify-center text-slate-500 text-sm">No data yet. Seed the DB to see charts.</div>}
                </motion.div>

                {/* Order Status Pie */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-1">Order Status</h3>
                    <p className="text-slate-500 text-xs mb-5">Distribution</p>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }} />
                                <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div className="h-52 flex items-center justify-center text-slate-500 text-sm">No order data yet.</div>}
                </motion.div>
            </div>

            {/* Top Products Table */}
            {stats?.topProducts?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="glass rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-5">🏆 Top Selling Products</h3>
                    <div className="space-y-3">
                        {stats.topProducts.map((p, i) => (
                            <div key={p._id} className="flex items-center gap-4">
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : 'bg-slate-700/40 text-slate-500'}`}>{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{p._id}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (p.totalQty / (stats.topProducts[0]?.totalQty || 1)) * 100)}%` }} />
                                        </div>
                                        <span className="text-slate-400 text-xs">{p.totalQty} units</span>
                                    </div>
                                </div>
                                <span className="text-green-400 text-sm font-semibold flex-shrink-0">₹{p.totalRevenue?.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
