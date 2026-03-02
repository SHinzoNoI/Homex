import React from 'react';

export function ProductSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="h-48 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton rounded-lg w-3/4" />
        <div className="h-3 skeleton rounded-lg w-1/2" />
        <div className="flex justify-between items-center">
          <div className="h-6 skeleton rounded-lg w-16" />
          <div className="h-8 skeleton rounded-xl w-16" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="h-4 skeleton rounded-lg w-1/2 mb-3" />
      <div className="h-8 skeleton rounded-lg w-2/3" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 skeleton rounded-lg" />
        </td>
      ))}
    </tr>
  );
}
