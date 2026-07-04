'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AppShell from '../../components/AppShell';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl2 shadow-panel p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-ink tabular font-display">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-ink mb-1">Dashboard</h1>
        <p className="text-sm text-gray-400 mb-6">Sales overview and reports</p>

        {!data ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Today's Sales" value={peso(data.todaySalesTotal)} sub={`${data.todayOrderCount} orders`} />
              <StatCard label="Average Ticket" value={peso(data.todayAvgTicket)} sub="per order today" />
              <StatCard label="Active Products" value={data.totalProducts} sub={`${data.lowStockProducts.length} low on stock`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-6">
              <div className="bg-white rounded-xl2 shadow-panel p-5">
                <h2 className="font-display font-bold text-ink mb-4">Last 7 days</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.weekSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8A97A3' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#8A97A3' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip formatter={(v) => peso(v)} cursor={{ fill: '#F4F6F8' }} />
                    <Bar dataKey="sales" fill="#1E9469" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl2 shadow-panel p-5">
                <h2 className="font-display font-bold text-ink mb-4">Today by payment method</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Cash', key: 'CASH', icon: '💵' },
                    { label: 'GCash', key: 'GCASH', icon: '📱' },
                    { label: 'Card', key: 'CARD', icon: '💳' },
                  ].map((m) => (
                    <div key={m.key} className="flex items-center justify-between text-sm">
                      <span>
                        {m.icon} {m.label}
                      </span>
                      <span className="tabular font-semibold text-ink">{peso(data.byMethod[m.key])}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl2 shadow-panel p-5">
                <h2 className="font-display font-bold text-ink mb-4">Top selling products</h2>
                {data.topProducts.length === 0 ? (
                  <p className="text-sm text-gray-400">No sales yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {data.topProducts.map((p) => (
                      <li key={p.productId} className="py-2 flex items-center justify-between text-sm">
                        <span className="text-ink">{p.name}</span>
                        <span className="text-gray-400">
                          {p.quantitySold} sold · <span className="tabular font-medium text-ink">{peso(p.revenue)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl2 shadow-panel p-5">
                <h2 className="font-display font-bold text-ink mb-4">Low stock alerts</h2>
                {data.lowStockProducts.length === 0 ? (
                  <p className="text-sm text-gray-400">All stocked up. 🎉</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {data.lowStockProducts.map((p) => (
                      <li key={p.id} className="py-2 flex items-center justify-between text-sm">
                        <span className="text-ink">{p.name}</span>
                        <span className={`tabular font-semibold ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                          {p.stock} left
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
