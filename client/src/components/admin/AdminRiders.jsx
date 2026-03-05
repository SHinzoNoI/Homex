import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRiders, createRider, updateRider, deleteRider } from '../../services/api';
import toast from 'react-hot-toast';

const statusBadge = { Available: 'bg-green-500/20 text-green-400 border-green-500/20', Delivering: 'bg-blue-500/20 text-blue-400 border-blue-500/20', 'Off Duty': 'bg-slate-500/20 text-slate-400 border-slate-500/20' };
const STATUSES = ['Available', 'Delivering', 'Off Duty'];

export default function AdminRiders() {
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', vehicleNo: '', status: 'Available', rating: '4.5', photo: '' });
    const [saving, setSaving] = useState(false);

    const load = () => { setLoading(true); getRiders().then(r => setRiders(r.data.data)).finally(() => setLoading(false)); };
    useEffect(load, []);

    const openAdd = () => { setEditing(null); setForm({ name: '', phone: '', vehicleNo: '', status: 'Available', rating: '4.5', photo: '' }); setModal(true); };
    const openEdit = (r) => { setEditing(r); setForm({ name: r.name, phone: r.phone, vehicleNo: r.vehicleNo || '', status: r.status, rating: String(r.rating || 4.5), photo: r.photo || '' }); setModal(true); };

    const handleSave = async () => {
        if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
        setSaving(true);
        try {
            const payload = { ...form, rating: Number(form.rating) };
            editing ? await updateRider(editing._id, payload) : await createRider(payload);
            toast.success(editing ? 'Rider updated!' : 'Rider added!', { style: { background: '#1e293b', color: '#f8fafc' } });
            setModal(false); load();
        } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this rider?')) return;
        await deleteRider(id); toast.success('Rider removed'); load();
    };

    const handleStatusChange = async (id, status) => {
        await updateRider(id, { status });
        toast.success(`Status → ${status}`, { style: { background: '#1e293b', color: '#f8fafc' } });
        load();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Delivery Partners</h2>
                    <p className="text-slate-400 text-sm">{riders.filter(r => r.status === 'Available').length} available · {riders.length} total</p>
                </div>
                <button onClick={openAdd} className="btn-primary text-sm px-4 py-2">+ Add Rider</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass rounded-2xl h-40 skeleton" />)
                ) : riders.map(r => (
                    <motion.div key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-4 border border-white/5">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                style={{ background: `hsl(${r.name.charCodeAt(0) * 11 % 360}, 55%, 30%)` }}>
                                {r.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{r.name}</p>
                                <p className="text-slate-400 text-xs">{r.phone}</p>
                                {r.vehicleNo && <p className="text-slate-500 text-xs mt-0.5">🚚 {r.vehicleNo}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${statusBadge[r.status] || ''}`}>{r.status}</span>
                                <span className="text-yellow-400 text-xs">⭐ {r.rating}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-xs">{r.totalDeliveries || 0} deliveries</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <select value={r.status} onChange={e => handleStatusChange(r._id, e.target.value)}
                                    className="bg-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none">
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button onClick={() => openEdit(r)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold">Edit</button>
                                <button onClick={() => handleDelete(r._id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">Remove</button>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {!loading && riders.length === 0 && (
                    <div className="col-span-full text-center py-16 text-slate-400">No riders registered yet.</div>
                )}
            </div>

            <AnimatePresence>
                {modal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md glass rounded-2xl p-6 z-50">
                            <h3 className="text-white font-bold text-lg mb-5">{editing ? 'Edit Rider' : 'Add Rider'}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[{ key: 'name', label: 'Name *', span: 2 }, { key: 'phone', label: 'Phone *' }, { key: 'vehicleNo', label: 'Vehicle No.' }, { key: 'rating', label: 'Rating', type: 'number' }, { key: 'photo', label: 'Photo URL', span: 2 }].map(f => (
                                    <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                                        <label className="block text-slate-400 text-xs mb-1 font-medium">{f.label}</label>
                                        <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                    </div>
                                ))}
                                <div className="col-span-2">
                                    <label className="block text-slate-400 text-xs mb-1 font-medium">Status</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setModal(false)} className="flex-1 btn-ghost text-sm py-2.5">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-50">{saving ? 'Saving...' : 'Save Rider'}</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
