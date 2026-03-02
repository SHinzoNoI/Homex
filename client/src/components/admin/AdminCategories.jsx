import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/api';
import toast from 'react-hot-toast';

const ICONS = ['📦', '🏗️', '🪵', '🪨', '🔌', '🔧', '🎨', '🛡️', '🪛', '🔩', '🏠', '💧'];

export default function AdminCategories() {
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', icon: '📦', isActive: true });
    const [saving, setSaving] = useState(false);

    const load = () => { setLoading(true); getCategories().then(r => setCats(r.data.data)).finally(() => setLoading(false)); };
    useEffect(load, []);

    const openAdd = () => { setEditing(null); setForm({ name: '', description: '', icon: '📦', isActive: true }); setModal(true); };
    const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description, icon: c.icon || '📦', isActive: c.isActive }); setModal(true); };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        setSaving(true);
        try {
            editing ? await updateCategory(editing._id, form) : await createCategory(form);
            toast.success(editing ? 'Category updated!' : 'Category created!', { style: { background: '#1e293b', color: '#f8fafc' } });
            setModal(false); load();
        } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this category?')) return;
        await deleteCategory(id); toast.success('Deleted'); load();
    };

    const handleToggle = async (c) => {
        await updateCategory(c._id, { isActive: !c.isActive });
        toast.success(c.isActive ? 'Category deactivated' : 'Category activated', { style: { background: '#1e293b', color: '#f8fafc' } });
        load();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Categories</h2>
                    <p className="text-slate-400 text-sm">{cats.length} categories configured</p>
                </div>
                <button onClick={openAdd} className="btn-primary text-sm px-4 py-2">+ Add Category</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass rounded-2xl h-28 skeleton" />)
                ) : cats.map(c => (
                    <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`glass rounded-2xl p-4 border transition-all ${c.isActive ? 'border-white/5' : 'border-red-500/20 opacity-60'}`}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-3xl">{c.icon || '📦'}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleToggle(c)}
                                    className={`text-xs px-2 py-1 rounded-lg font-semibold ${c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {c.isActive ? 'Active' : 'Hidden'}
                                </button>
                            </div>
                        </div>
                        <p className="text-white font-semibold text-sm">{c.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{c.description || 'No description'}</p>
                        <div className="flex gap-3 mt-3">
                            <button onClick={() => openEdit(c)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold">Edit</button>
                            <button onClick={() => handleDelete(c._id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">Delete</button>
                        </div>
                    </motion.div>
                ))}
                {!loading && cats.length === 0 && (
                    <div className="col-span-full text-center py-16 text-slate-500">No categories yet. Add your first one!</div>
                )}
            </div>

            <AnimatePresence>
                {modal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md glass rounded-2xl p-6 z-50">
                            <h3 className="text-white font-bold text-lg mb-5">{editing ? 'Edit Category' : 'Add Category'}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-400 text-xs mb-1 font-medium">Name *</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs mb-1 font-medium">Description</label>
                                    <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs mb-2 font-medium">Icon</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ICONS.map(icon => (
                                            <button key={icon} onClick={() => setForm(p => ({ ...p, icon }))}
                                                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === icon ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-slate-800 hover:bg-slate-700'}`}>
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="catActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                                    <label htmlFor="catActive" className="text-slate-300 text-sm">Active (visible in store)</label>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setModal(false)} className="flex-1 btn-ghost text-sm py-2.5">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
