import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getStats, getOrders, updateOrderStatus as updateOrder, getProducts, createProduct, updateProduct, deleteProduct, getRiders } from '../services/api';
import AdminCategories from '../components/admin/AdminCategories';
import AdminCoupons from '../components/admin/AdminCoupons';
import AdminRiders from '../components/admin/AdminRiders';
import AdminReports from '../components/admin/AdminReports';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Animated counter
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    if (value === undefined || value === null) return;
    const numVal = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
    const start = prevRef.current;
    const diff = numVal - start;
    const steps = Math.ceil(duration / 16);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setDisplay(Math.round(start + diff * eased));
      if (step >= steps) { setDisplay(numVal); prevRef.current = numVal; clearInterval(timer); }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

const statusColors = {
  'Placed': 'status-placed', 'Confirmed': 'status-confirmed', 'Packed': 'status-packed',
  'Dispatched': 'status-dispatched', 'Out for Delivery': 'status-out-for-delivery',
  'Delivered': 'status-delivered', 'Cancelled': 'status-cancelled',
};
const STATUSES = ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled'];

const navLinks = [
  { to: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/admin/products', label: 'Products', icon: '📦' },
  { to: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { to: '/admin/orders', label: 'Orders', icon: '🛒' },
  { to: '/admin/riders', label: 'Riders', icon: '🚚' },
  { to: '/admin/coupons', label: 'Coupons', icon: '🎟️' },
  { to: '/admin/reports', label: 'Reports', icon: '📈' },
];

function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const pageTitle = navLinks.find(l => l.exact ? location.pathname === l.to : location.pathname.startsWith(l.to))?.label || 'Admin';

  return (
    <div className="min-h-screen bg-[#020617] flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">HX</div>
            <div>
              <p className="text-white font-bold text-sm">HomeX</p>
              <p className="text-blue-400 text-xs">Admin Panel</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {navLinks.map(link => {
            const active = link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to) && link.to !== '/admin';
            const isExactAdmin = link.exact && location.pathname === '/admin';
            return (
              <Link key={link.to} to={link.to} onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${active || isExactAdmin ? 'active' : ''}`}>
                <span className="text-lg">{link.icon}</span> {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-1">
          <Link to="/shop" className="sidebar-link"><span>🛍️</span> Back to Store</Link>
          <Link to="/rider" className="sidebar-link"><span>🛵</span> Rider Panel</Link>
          <button onClick={handleLogout} className="sidebar-link w-full text-left text-red-400 hover:text-red-300">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="sticky top-0 z-30 bg-[#0f172a]/90 backdrop-blur-lg border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="hidden lg:block">
              <p className="text-white font-semibold capitalize">{pageTitle}</p>
              <p className="text-slate-500 text-xs">HomeX Operations Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 bg-green-400 rounded-full" />
              Live
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg">AD</div>
          </div>
        </div>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = () => { getStats().then(r => setStats(r.data.data)).catch(() => { }).finally(() => setLoading(false)); };
  useEffect(load, []);

  const statCards = stats ? [
    { label: 'Total Revenue', value: stats.revenue, prefix: '₹', icon: '💰', color: 'from-green-600/20 to-green-800/20 border-green-500/20', trend: '+18%', trendColor: 'text-green-400' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '🛒', color: 'from-blue-600/20 to-blue-800/20 border-blue-500/20', trend: '+12%', trendColor: 'text-green-400' },
    { label: 'Orders Today', value: stats.ordersToday, icon: '📅', color: 'from-purple-600/20 to-purple-800/20 border-purple-500/20', trend: 'Today', trendColor: 'text-blue-400' },
    { label: 'Active Orders', value: stats.activeOrders, icon: '⚡', color: 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/20', trend: 'In Progress', trendColor: 'text-yellow-400' },
  ] : [];

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="glass rounded-2xl p-6 h-32 skeleton" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl p-6 bg-gradient-to-br ${s.color} border overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
            <div className="shimmer absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium mb-1">{s.label}</p>
                <p className="text-white font-bold text-2xl"><AnimatedNumber value={s.value} prefix={s.prefix || ''} /></p>
                <p className={`text-xs mt-1.5 font-semibold ${s.trendColor}`}>↑ {s.trend}</p>
              </div>
              <span className="text-3xl">{s.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {stats?.lowStockItems?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-4">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-red-400 font-semibold mb-2">{stats.lowStockItems.length} Products Low on Stock</p>
            <div className="flex flex-wrap gap-2">
              {stats.lowStockItems.map(p => (
                <span key={p._id} className="text-xs bg-red-500/20 text-red-300 border border-red-500/20 px-2.5 py-1 rounded-full font-medium">
                  {p.name} — {p.stock} left
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="glass rounded-2xl p-5 border border-white/5">
        <h3 className="text-white font-semibold text-sm mb-4">⚡ Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/products" className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all">
            📦 Manage Products
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all">
            🛒 View Orders
          </Link>
          <Link to="/admin/coupons" className="flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 hover:text-yellow-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all">
            🎟️ Manage Coupons
          </Link>
          <Link to="/admin/reports" className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 hover:text-green-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all">
            📈 Sales Reports
          </Link>
          <a href="/rider" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all">
            🚚 Rider Panel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-1">Revenue Trend</h3>
          <p className="text-slate-500 text-xs mb-5">Last 7 days</p>
          {stats?.dailyOrders?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.dailyOrders}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="_id" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }} formatter={val => [`₹${val.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Seed the database to see charts</div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5">📋 Recent Activity</h3>
          {stats?.recentActivity?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((a, i) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.status === 'Delivered' ? 'bg-green-400' : a.status === 'Out for Delivery' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-blue-400 text-xs font-mono font-bold">{a.orderId}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md border ${statusColors[a.status] || 'status-confirmed'}`}>{a.status}</span>
                    </div>
                    <p className="text-white text-sm mt-0.5">{a.customer}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white text-sm font-semibold">₹{a.amount?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-slate-500 text-sm py-8 text-center">No activity yet</div>}
        </motion.div>
      </div>
    </div>
  );
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: '', unit: 'bag', brand: '', description: '', image: '', featured: false });
  const [saving, setSaving] = useState(false);

  // Default categories if none from DB
  const DEFAULT_CATS = ['Cement', 'Steel', 'Bricks', 'Sand', 'Timber', 'Plumbing', 'Electrical', 'Paint', 'Tools', 'Safety'];

  const load = () => {
    setLoading(true);
    Promise.all([
      getProducts().then(r => setProducts(r.data.data)),
      import('../services/api').then(({ getCategories }) => getCategories().then(r => setCategories(r.data.data.filter(c => c.isActive).map(c => c.name))).catch(() => { }))
    ]).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const catList = categories.length > 0 ? categories : DEFAULT_CATS;

  const openAdd = () => { setEditing(null); setForm({ name: '', category: catList[0] || 'Cement', price: '', stock: '', unit: 'bag', brand: '', description: '', image: '', featured: false }); setModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p, price: String(p.price), stock: String(p.stock) }); setModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const data = { ...form, price: Number(form.price), stock: Number(form.stock) };
      editing ? await updateProduct(editing._id, data) : await createProduct(data);
      toast.success(editing ? 'Product updated!' : 'Product created!', { style: { background: '#1e293b', color: '#f8fafc' } });
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct(id); toast.success('Deleted'); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Products</h2>
          <p className="text-slate-400 text-sm">{products.length} items in inventory</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm px-4 py-2">+ Add Product</button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded-lg" /></td>)}</tr>)
              ) : products.map(p => (
                <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden">
                        <img src={p.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&q=80'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold line-clamp-1 max-w-xs">{p.name}</p>
                        {p.brand && <p className="text-slate-500 text-xs">{p.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">{p.category}</span>
                  </td>
                  <td className="px-4 py-3 text-white text-sm font-bold">₹{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${p.stock <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                      {p.stock <= 10 && '⚠️ '}{p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.featured && <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">⭐ Featured</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(p)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold">Edit</button>
                      <button onClick={() => handleDelete(p._id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">Delete</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && products.length === 0 && <div className="text-center py-16 text-slate-400">No products yet.</div>}
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg glass rounded-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
              <h3 className="text-white font-bold text-lg mb-5">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ key: 'name', label: 'Name *', span: 2 }, { key: 'brand', label: 'Brand' }, { key: 'unit', label: 'Unit' }, { key: 'price', label: 'Price (₹) *', type: 'number' }, { key: 'stock', label: 'Stock *', type: 'number' }, { key: 'image', label: 'Image URL', span: 2 }, { key: 'description', label: 'Description', span: 2, textarea: true }].map(f => (
                  <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-slate-400 text-xs mb-1 font-medium">{f.label}</label>
                    {f.textarea ? (
                      <textarea rows={2} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
                    ) : (
                      <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-slate-400 text-xs mb-1 font-medium">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                    {catList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                  <label htmlFor="featured" className="text-slate-300 text-sm">Featured product</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setModal(false)} className="flex-1 btn-ghost text-sm py-2.5">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-50">{saving ? 'Saving...' : 'Save Product'}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const load = () => {
    setLoading(true);
    Promise.all([
      getOrders().then(r => setOrders(r.data.data)),
      getRiders().then(r => setRiders(r.data.data)).catch(() => setRiders([]))
    ]).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleUpdate = async (id, data) => {
    await updateOrder(id, data);
    toast.success('Order updated', { style: { background: '#1e293b', color: '#f8fafc' } });
    load();
  };

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Orders</h2>
          <p className="text-slate-400 text-sm">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'Placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
          <button onClick={load} className="btn-ghost text-sm px-3 py-1.5 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Order', 'Customer', 'Amount', 'Items', 'Status', 'Assign Rider', 'Time'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded-lg" /></td>)}</tr>)
              ) : filtered.map(o => (
                <tr key={o._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-blue-400 font-mono text-xs font-bold">{o.orderId}</p>
                    <p className="text-slate-600 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm font-medium">{o.customerName}</p>
                    {o.customerPhone && <p className="text-slate-500 text-xs">{o.customerPhone}</p>}
                  </td>
                  <td className="px-4 py-3 text-white text-sm font-bold">₹{o.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{o.items.length}</td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={e => handleUpdate(o._id, { status: e.target.value })}
                      className={`text-xs font-semibold px-2 py-1.5 rounded-lg border cursor-pointer focus:outline-none bg-transparent ${statusColors[o.status] || ''}`}
                      style={{ backgroundColor: 'transparent' }}>
                      {STATUSES.map(s => <option key={s} value={s} style={{ background: '#1e293b' }}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.assignedRider?._id || o.assignedRider || ''}
                      onChange={e => handleUpdate(o._id, { assignedRider: e.target.value || null })}
                      className="bg-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 border border-slate-700 focus:outline-none focus:border-blue-500">
                      <option value="">— Assign Rider</option>
                      {riders.map(r => <option key={r._id} value={r._id}>{r.name} ({r.status})</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">No orders for this filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="products" element={<ProductsAdmin />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<OrdersAdmin />} />
        <Route path="riders" element={<AdminRiders />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="reports" element={<AdminReports />} />
      </Routes>
    </AdminLayout>
  );
}
