import React from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

const categoryColors = {
  'Cement': 'badge-cement',
  'Steel': 'badge-steel',
  'Bricks': 'badge-bricks',
  'Sand': 'badge-sand',
  'Timber': 'badge-timber',
  'Plumbing': 'badge-plumbing',
  'Electrical': 'badge-electrical',
  'Paint': 'badge-paint',
  'Tools': 'badge-tools',
  'Safety': 'badge-safety',
};

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const isLowStock = product.stock <= 10;
  const isOutOfStock = product.stock === 0;
  const badgeClass = categoryColors[product.category] || 'badge-tools';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="group glass rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/20 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-48 img-zoom-container bg-slate-900">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80'}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
            {product.category}
          </span>
        </div>

        {/* Low stock / Out of stock badge */}
        {isOutOfStock ? (
          <div className="absolute top-3 right-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/90 text-white">Out of Stock</span>
          </div>
        ) : isLowStock ? (
          <div className="absolute top-3 right-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 badge-pulse-red">
              Only {product.stock} left
            </span>
          </div>
        ) : null}

        {/* Featured badge */}
        {product.featured && (
          <div className="absolute bottom-3 right-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-600/90 text-white">⭐ Featured</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          {/* Brand */}
          {product.brand && (
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-1">{product.brand}</p>
          )}

          {/* Name */}
          <h3 className="text-white font-bold text-sm leading-tight mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-3">
            {product.description}
          </p>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-white font-bold text-xl">
              ₹{product.price.toLocaleString()}
              <span className="text-slate-400 text-xs font-normal ml-1">/{product.unit}</span>
            </p>
            {!isLowStock && !isOutOfStock && (
              <p className="text-green-400 text-xs mt-0.5">✓ {product.stock} in stock</p>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => !isOutOfStock && addItem(product)}
            disabled={isOutOfStock}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isOutOfStock
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/30'
              }`}
          >
            {isOutOfStock ? '—' : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
