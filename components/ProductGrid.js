'use client';

import { useMemo, useState } from 'react';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

export default function ProductGrid({ products, categories, onAdd }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      return matchesQuery && matchesCategory && p.isActive;
    });
  }, [products, query, activeCategory]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 border-b border-gray-100">
        <input
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-peso-500"
          placeholder="Search product name or SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              activeCategory === 'all' ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                activeCategory === c.id ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-10">No products match. Try a different search.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onAdd(p)}
                disabled={p.stock <= 0}
                className="text-left bg-white border border-gray-100 rounded-xl p-3 hover:border-peso-400 hover:shadow-panel transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="w-full aspect-square rounded-lg bg-peso-50 mb-2 flex items-center justify-center text-peso-500 font-display font-bold text-lg overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    p.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <p className="text-sm font-medium text-ink line-clamp-2 leading-snug">{p.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-semibold tabular text-peso-600">{peso(p.price)}</span>
                  <span className={`text-[11px] ${p.stock <= 5 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {p.stock} left
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
