import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">HX</div>
              <span className="text-white font-bold text-xl">HomeX</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Emergency construction material delivery in 45 minutes. Serving contractors, builders, and project managers across Mumbai.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {['Twitter', 'LinkedIn', 'Instagram'].map(s => (
                <a key={s} href="#" className="w-9 h-9 glass rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600/20 transition-all text-xs font-medium">
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-3">
              {[{ to: '/shop', label: 'Shop Now' }, { to: '/orders', label: 'Track Order' }, { to: '/admin', label: 'Admin Panel' }, { to: '/rider', label: 'Rider Panel' }].map(item => (
                <li key={item.to}>
                  <Link to={item.to} className="text-slate-400 hover:text-blue-400 text-sm transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Contact</h4>
            <div className="space-y-3">
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <span>📍</span> Andheri East, Mumbai 400069
              </p>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <span>📞</span> +91 98765 43210
              </p>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <span>✉️</span> support@homex.in
              </p>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <span>🕐</span> 24/7 Emergency Service
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">© 2024 HomeX Technologies Pvt Ltd. All rights reserved.</p>
          <p className="text-slate-500 text-sm">Made for contractors, by contractors 🏗️</p>
        </div>
      </div>
    </footer>
  );
}
