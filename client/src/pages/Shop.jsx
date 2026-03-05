import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/api';

const CATEGORIES = ['All', 'Cement', 'Steel', 'Bricks', 'Sand', 'Timber', 'Plumbing', 'Electrical', 'Paint', 'Tools', 'Safety'];
const CAT_ICONS = {
  All: '🏗️', Cement: '🏺', Steel: '🔩', Bricks: '🧱', Sand: '⛱️',
  Timber: '🪵', Plumbing: '🔧', Electrical: '⚡', Paint: '🎨', Tools: '🔨', Safety: '🦺'
};

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'price:asc',  label: 'Price: Low → High' },
  { value: 'price:desc', label: 'Price: High → Low' },
  { value: 'stock:desc', label: 'In Stock First' },
  { value: 'name:asc',   label: 'A → Z' },
];

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt:desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { setIsOpen } = useCart();
  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sortField, sortOrder] = sortBy.split(':');
      const params = {
        category: category === 'All' ? undefined : category,
        search: debouncedSearch || undefined,
        sort: sortField,
        order: sortOrder,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        limit: 60,
      };
      const res = await getProducts(params);
      setProducts(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, [category, debouncedSearch, sortBy, minPrice, maxPrice]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => {
    setSearch(''); setSortBy('createdAt:desc');
    setMinPrice(''); setMaxPrice('');
    setCategory('All');
  };

  const hasFilters = category !== 'All' || search || sortBy !== 'createdAt:desc' || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <CartDrawer />

      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white mb-1">
            Construction Materials
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-green-400 text-xs font-semibold">Live Inventory</span>
            </div>
            <span className="text-slate-600 text-xs">|</span>
            <span className="text-slate-400 text-xs">
              <span className="text-blue-400 font-semibold">{loading ? '...' : total}</span> products • 45-min delivery
            </span>
          </motion.div>
        </div>

        {/* Search + Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base">🔍</div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cement, steel, bricks, brand..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">✕</button>
            )}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer min-w-40">
            {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={() => setShowFilters(s => !s)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${showFilters || minPrice || maxPrice ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
            ⚙️ Filters {(minPrice || maxPrice) && <span className="w-2 h-2 bg-blue-400 rounded-full" />}
          </button>
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm transition-all bg-slate-800">
              ✕ Clear
            </button>
          )}
        </div>

        {/* Price filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6">
              <div className="flex gap-3 pb-2">
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
                  <span className="text-slate-500 text-xs">₹ Min</span>
                  <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                    placeholder="0" className="bg-transparent text-white text-sm w-20 focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
                  <span className="text-slate-500 text-xs">₹ Max</span>
                  <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                    placeholder="99999" className="bg-transparent text-white text-sm w-20 focus:outline-none" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6 -mx-4 px-4">
          {CATEGORIES.map(cat => (
            <motion.button key={cat} whileTap={{ scale: 0.95 }} onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 border ${
                category === cat
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'glass border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}>
              <span className="text-base">{CAT_ICONS[cat]}</span>
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-16">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-white text-xl font-bold mb-2">No products found</p>
            <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="mt-6 btn-primary">Clear filters</button>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-16">
            <AnimatePresence>
              {products.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
