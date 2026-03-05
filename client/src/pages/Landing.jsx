import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../services/api';

// Trust badges data
const TRUST_BADGES = [
  { icon: '🏅', label: 'ISI Certified' },
  { icon: '🧾', label: 'GST Invoice' },
  { icon: '🔒', label: 'Secure Checkout' },
  { icon: '🕐', label: '24/7 Support' },
  { icon: '↩️', label: 'Easy Returns' },
  { icon: '🚀', label: '45-Min Guaranteed' },
  { icon: '⭐', label: '4.9★ Rated' },
];

// Live pulse notifications
const LIVE_ORDERS = [
  { emoji: '🏗️', text: 'Rajesh ordered 50 bags UltraTech Cement', time: '12s ago', color: 'text-amber-400' },
  { emoji: '🚚', text: 'Ravi Kumar delivered to Andheri East', time: '1m ago', color: 'text-green-400' },
  { emoji: '📦', text: 'New order HX-0048 confirmed — Worli', time: '2m ago', color: 'text-blue-400' },
  { emoji: '⭐', text: 'Priya Mehta rated 5★ — "Super fast!"', time: '3m ago', color: 'text-yellow-400' },
  { emoji: '🧱', text: 'Deepak ordered emergency TMT Steel Bars', time: '4m ago', color: 'text-purple-400' },
  { emoji: '✅', text: 'Order HX-0051 delivered in 38 minutes!', time: '5m ago', color: 'text-green-400' },
];

function LivePulseWidget() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LIVE_ORDERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  if (!visible) return null;
  const item = LIVE_ORDERS[idx];

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 1.5, type: 'spring', damping: 20 }}
      className="fixed bottom-6 left-6 z-40 max-w-xs"
    >
      <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 bg-green-400 rounded-full"
            />
            <span className="text-white text-xs font-bold">Live Orders</span>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
          >✕</button>
        </div>
        {/* Content */}
        <div className="px-4 py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-3"
            >
              <span className="text-xl flex-shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-xs leading-snug">{item.text}</p>
                <p className={`text-xs mt-0.5 font-semibold ${item.color}`}>{item.time}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-800">
          <motion.div
            key={idx}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 4, ease: 'linear' }}
            className="h-full bg-blue-500"
          />
        </div>
      </div>
    </motion.div>
  );
}

function TrustBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="w-full overflow-hidden py-3"
    >
      <div className="flex items-center gap-6 justify-center flex-wrap">
        {TRUST_BADGES.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + i * 0.07 }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-default"
          >
            <span className="text-sm">{b.icon}</span>
            <span className="text-xs font-medium">{b.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Animated counter hook
function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const numericEnd = parseFloat(String(end).replace(/[^0-9.]/g, ''));
    let start = 0;
    const step = numericEnd / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numericEnd) {
        setCount(numericEnd);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return count;
}

const statsData = [
  { value: 45, suffix: ' min', label: 'Delivery Guarantee', icon: '⚡' },
  { value: 500, suffix: '+', label: 'Products Available', icon: '📦' },
  { value: 2000, suffix: '+', label: 'Active Contractors', icon: '🧑‍💼' },
  { value: 98, suffix: '%', label: 'On-Time Delivery', icon: '✅' },
];

// Activity ticker items
const ACTIVITY = [
  '🏗️  Rajesh just ordered 50 bags of UltraTech Cement',
  '🚚  Ravi Kumar delivered to Andheri East — 42 mins',
  '📦  New order HX-2025-0048 confirmed',
  '⭐  Priya Mehta rated 5 stars — "Super fast delivery!"',
  '🏗️  Deepak placed emergency order of TMT Steel Bars',
  '🚚  Suresh Patel picked up from Worli warehouse',
  '📦  Order HX-2025-0051 — Out for Delivery',
  '✅  Amit Patel order delivered in 38 minutes!',
];

function StatCard({ value, suffix, label, icon, delay }) {
  const count = useCountUp(value, 2200);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-2xl p-5 text-center hover:border-blue-500/30 transition-all duration-300 border border-white/5"
    >
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-white font-bold text-3xl">
        {count}{suffix}
      </p>
      <p className="text-slate-400 text-xs mt-1">{label}</p>
    </motion.div>
  );
}

function ActivityTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % ACTIVITY.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <AnimatePresenceWrapper>
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-full px-5 py-2.5 border border-white/10 inline-flex items-center gap-2"
      >
        <motion.span
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"
        />
        <span className="text-slate-300 text-sm">{ACTIVITY[index]}</span>
      </motion.div>
    </AnimatePresenceWrapper>
  );
}

// Simple wrapper since AnimatePresence needs to be imported
function AnimatePresenceWrapper({ children }) {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
}

const steps = [
  { step: '01', icon: '🧱', title: 'Select Material', desc: 'Browse 500+ construction materials. Filter by category, brand, or urgency. Real-time stock visibility.', color: 'from-blue-600/20 to-blue-800/20 border-blue-500/20', dot: 'bg-blue-500' },
  { step: '02', icon: '⚡', title: 'Fast Dispatch', desc: 'Our dark stores are strategically placed. Within seconds of your order, our team starts packing.', color: 'from-purple-600/20 to-purple-800/20 border-purple-500/20', dot: 'bg-purple-500' },
  { step: '03', icon: '🚚', title: 'Delivered in 45 Min', desc: 'Dedicated fleet of heavy-duty delivery vehicles ensure your materials reach the site on time.', color: 'from-green-600/20 to-green-800/20 border-green-500/20', dot: 'bg-green-500' },
];

const whyUs = [
  { icon: '🏪', title: 'Dark Store Network', desc: 'Strategically placed mini-warehouses across the city for ultra-fast fulfillment.' },
  { icon: '⚡', title: 'Emergency Ready', desc: 'Site emergency? We dispatch within 5 minutes. No delays, no excuses.' },
  { icon: '📦', title: '500+ Materials', desc: 'Cement, steel, bricks, plumbing, electrical — everything under one roof.' },
  { icon: '💰', title: 'Contractor Pricing', desc: 'Bulk pricing, credit accounts, and GST invoicing for registered contractors.' },
  { icon: '📍', title: 'Live Tracking', desc: 'Real-time GPS tracking from dispatch to your site door.' },
  { icon: '🔒', title: 'Quality Assured', desc: 'ISI marked, branded materials only. No compromises on quality.' },
];

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ featured: true })
      .then(r => setFeatured(r.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] bg-mesh">
      <Navbar />
      <CartDrawer />
      <LivePulseWidget />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated orbs */}
        <div className="orb w-[500px] h-[500px] bg-blue-600 top-10 -left-48 opacity-10" />
        <div className="orb w-80 h-80 bg-purple-700 bottom-10 -right-20 opacity-10" style={{ animationDelay: '3s' }} />
        <div className="orb w-64 h-64 bg-blue-800 top-1/2 left-1/2 opacity-10" style={{ animationDelay: '6s' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(to right, rgba(59,130,246,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          {/* Live badge */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6 border border-blue-500/20"
          >
            <motion.span
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 bg-green-400 rounded-full"
            />
            <span className="text-slate-300 text-sm font-medium">Now delivering across Mumbai • 24/7</span>
            <span className="text-blue-400 text-xs font-bold ml-1">LIVE →</span>
          </motion.div>

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-none tracking-tight mb-6">
              Construction<br />
              <span className="gradient-text">Materials</span><br />
              in 45 Minutes
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            Emergency supply for contractors and builders. Cement, steel, bricks, plumbing — delivered to your site before your crew even notices the shortage.
          </motion.p>

          {/* Activity Ticker */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mb-10 flex justify-center"
          >
            <ActivityTicker />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Link to="/shop" className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2 justify-center">
              <span>Start Ordering</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link to="/admin" className="btn-ghost text-base px-8 py-4 inline-flex items-center gap-2 justify-center">
              <span>View Live Demo</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </Link>
          </motion.div>

          {/* Trust Bar */}
          <div className="max-w-3xl mx-auto mb-8 border-t border-b border-white/5 py-1">
            <TrustBar />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {statsData.map((s, i) => (
              <StatCard key={i} {...s} delay={0.6 + i * 0.1} />
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3">Order in 3 Simple Steps</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} whileHover={{ y: -8 }}
                className={`relative rounded-2xl p-8 bg-gradient-to-br ${s.color} border transition-all duration-300`}
              >
                <div className="text-5xl mb-6">{s.icon}</div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className="text-slate-500 text-xs font-bold tracking-widest">STEP {s.step}</span>
                </div>
                <h3 className="text-white text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                {i < 2 && <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10"><svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">Top Materials</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mt-3">Emergency Essentials</h2>
            </motion.div>
            <Link to="/shop" className="hidden md:flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">
              View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl overflow-hidden">
                  <div className="h-48 skeleton" />
                  <div className="p-4 space-y-3"><div className="h-4 skeleton rounded-lg" /><div className="h-3 skeleton rounded-lg w-2/3" /><div className="flex justify-between"><div className="h-6 skeleton rounded-lg w-16" /><div className="h-8 skeleton rounded-xl w-16" /></div></div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.slice(0, 8).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-2xl">
              <p className="text-slate-400">No featured products yet. <Link to="/admin" className="text-blue-400">Seed the database →</Link></p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
              Browse All Materials
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* WHY HOMEX */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">Why HomeX</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3">Built for the Construction Industry</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyUs.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-blue-500/20 transition-all duration-300"
              >
                <span className="text-3xl">{item.icon}</span>
                <h3 className="text-white font-bold text-lg mt-4 mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-12 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.3) 0%, rgba(59,130,246,0.1) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <div className="absolute inset-0 bg-mesh" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Site Emergency?</h2>
              <p className="text-slate-300 text-lg mb-8">Don't let material shortage stop your project. We deliver in 45 minutes, guaranteed.</p>
              <Link to="/shop" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                <span>Order Emergency Supply</span>
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
