import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', expiryDate: '', description: '', isActive: true });
    const [saving, setSaving] = useState(false);

    const load = () => { setLoading(true); getCoupons().then(r => setCoupons(r.data.data)).finally(() => setLoading(false)); };
    useEffect(load, []);

    const openAdd = () => { setEditing(null); setForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', expiryDate: '', description: '', isActive: true }); setModal(true); };
    const openEdit = (c) => {
        setEditing(c);
        setForm({
            code: c.code, discountType: c.discountType, discountValue: String(c.discountValue),
            minOrderAmount: String(c.minOrderAmount || ''), maxUses: c.maxUses != null ? String(c.maxUses) : '',
            expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : '', description: c.description || '', isActive: c.isActive
        });
        setModal(true);
    };

    const handleSave = async () => {
        if (!form.code || !form.discountValue) { toast.error('Code and discount value required'); return; }
        setSaving(true);
        try {
            const payload = {
                ...form,
                discountValue: Number(form.discountValue),
                minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
                maxUses: form.maxUses ? Number(form.maxUses) : null,
                expiryDate: form.expiryDate || null,
            };
            editing ? await updateCoupon(editing._id, payload) : await createCoupon(payload);
            toast.success(editing ? 'Coupon updated!' : 'Coupon created!', { style: { background: '#1e293b', color: '#f8fafc' } });
            setModal(false); load();
        } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this coupon?')) return;
        await deleteCoupon(id); toast.success('Deleted'); load();
    };

    const handleToggle = async (c) => {
        await updateCoupon(c._id, { isActive: !c.isActive });
        toast.success(c.isActive ? 'Coupon disabled' : 'Coupon enabled', { style: { background: '#1e293b', color: '#f8fafc' } });
        load();
    };

    const isExpired = (c) => c.expiryDate && new Date(c.expiryDate) < new Date();
    const isFull = (c) => c.maxUses != null && c.usedCount >= c.maxUses;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Coupons</h2>
                    <p className="text-slate-400 text-sm">{coupons.filter(c => c.isActive).length} active coupons</p>
                </div>
                <button onClick={openAdd} className="btn-primary text-sm px-4 py-2">+ Add Coupon</button>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            {['Code', 'Discount', 'Min Order', 'Usage', 'Expiry', 'Status', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded-lg" /></td>)}</tr>)
                        ) : coupons.map(c => (
                            <tr key={c._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                <td className="px-4 py-3">
                                    <span className="font-mono font-bold text-yellow-400 text-sm bg-yellow-500/10 px-2 py-1 rounded-lg">{c.code}</span>
                                    {c.description && <p className="text-slate-500 text-xs mt-1">{c.description}</p>}
                                </td>
                                <td className="px-4 py-3 text-white font-bold text-sm">
                                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                    <p className="text-slate-500 text-xs font-normal">{c.discountType}</p>
                                </td>
                                <td className="px-4 py-3 text-slate-300 text-sm">₹{c.minOrderAmount || 0}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`font-semibold ${isFull(c) ? 'text-red-400' : 'text-green-400'}`}>
                                        {c.usedCount}{c.maxUses != null ? `/${c.maxUses}` : '/∞'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {c.expiryDate ? (
                                        <span className={isExpired(c) ? 'text-red-400' : 'text-slate-300'}>
                                            {new Date(c.expiryDate).toLocaleDateString('en-IN')}
                                        </span>
                                    ) : <span className="text-slate-500">Never</span>}
                                </td>
                                <td className="px-4 py-3">
                                    {isExpired(c) ? (
                                        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">Expired</span>
                                    ) : isFull(c) ? (
                                        <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">Used Up</span>
                                    ) : c.isActive ? (
                                        <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">Active</span>
                                    ) : (
                                        <span className="text-xs bg-slate-500/20 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded-full">Disabled</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => openEdit(c)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold">Edit</button>
                                        <button onClick={() => handleToggle(c)} className="text-yellow-400 hover:text-yellow-300 text-xs font-semibold">{c.isActive ? 'Disable' : 'Enable'}</button>
                                        <button onClick={() => handleDelete(c._id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && coupons.length === 0 && <div className="text-center py-16 text-slate-400">No coupons yet.</div>}
            </div>

            <AnimatePresence>
                {modal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg glass rounded-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-white font-bold text-lg mb-5">{editing ? 'Edit Coupon' : 'Add Coupon'}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-slate-400 text-xs mb-1 font-medium">Code * (e.g. SAVE20)</label>
                                    <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold uppercase text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs mb-1 font-medium">Type</label>
                                    <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs mb-1 font-medium">Value *</label>
                                    <input type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs mb-1 font-medium">Min Order (₹)</label>
                                    <input type="number" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                                        placeholder="0" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs mb-1 font-medium">Max Uses (blank = ∞)</label>
                                    <input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                                        placeholder="Unlimited" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-slate-400 text-xs mb-1 font-medium">Expiry Date (blank = never)</label>
                                    <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-slate-400 text-xs mb-1 font-medium">Description</label>
                                    <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <input type="checkbox" id="cpnActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                                    <label htmlFor="cpnActive" className="text-slate-300 text-sm">Active</label>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setModal(false)} className="flex-1 btn-ghost text-sm py-2.5">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-50">{saving ? 'Saving...' : 'Save Coupon'}</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
