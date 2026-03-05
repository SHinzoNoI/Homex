import React from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  { key: 'Placed', label: 'Order Placed', icon: '📋', desc: 'We received your order' },
  { key: 'Confirmed', label: 'Confirmed', icon: '✅', desc: 'Order confirmed & invoiced' },
  { key: 'Packed', label: 'Packed', icon: '📦', desc: 'Materials packed & ready' },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: '🚚', desc: 'Rider on the way to your site' },
  { key: 'Delivered', label: 'Delivered', icon: '🏁', desc: 'Successfully delivered' },
];

const STATUS_ORDER = ['Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];

export default function OrderTimeline({ status, animated = false }) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const isCancelled = status === 'Cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
        <span className="text-2xl">❌</span>
        <div>
          <p className="text-red-400 font-semibold">Order Cancelled</p>
          <p className="text-slate-400 text-xs mt-0.5">This order has been cancelled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isPending = i > currentIndex;

        return (
          <div key={step.key} className="relative flex items-start gap-4">
            {/* Vertical line */}
            {i < STEPS.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-700">
                {isDone && (
                  <motion.div
                    initial={animated ? { height: 0 } : { height: '100%' }}
                    animate={{ height: '100%' }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    className="bg-blue-500 w-full"
                  />
                )}
              </div>
            )}

            {/* Step dot */}
            <motion.div
              initial={animated ? { scale: 0 } : { scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ delay: animated ? i * 0.15 : 0 }}
              className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all duration-300 ${isDone
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : isCurrent
                    ? 'bg-blue-600/30 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-600'
                }`}
            >
              {isDone ? '✓' : isCurrent ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full"
                />
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-600" />
              )}
            </motion.div>

            {/* Step content */}
            <div className={`pb-5 flex-1 ${i === STEPS.length - 1 ? '' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{step.icon}</span>
                <p className={`font-semibold text-sm ${isDone || isCurrent ? 'text-white' : 'text-slate-500'
                  }`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                  />
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isDone || isCurrent ? 'text-slate-400' : 'text-slate-600'}`}>
                {step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
