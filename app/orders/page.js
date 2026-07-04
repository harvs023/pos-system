'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import ReceiptModal from '../../components/ReceiptModal';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

const STATUS_STYLE = {
  PAID: 'bg-peso-50 text-peso-600',
  PENDING: 'bg-amber-50 text-amber-600',
  CANCELLED: 'bg-red-50 text-red-500',
  REFUNDED: 'bg-gray-100 text-gray-500',
};

const METHOD_ICON = { CASH: '💵', GCASH: '📱', CARD: '💳' };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewOrder, setViewOrder] = useState(null);

  useEffect(() => {
    fetch('/api/orders?limit=100')
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-ink mb-1">Orders</h1>
        <p className="text-sm text-gray-400 mb-6">{orders.length} recent transactions</p>

        <div className="bg-white rounded-xl2 shadow-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Order #</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Cashier</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No orders yet. Make a sale on the Terminal.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-mono text-xs text-ink">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleString('en-PH')}</td>
                  <td className="px-4 py-3 text-gray-500">{o.cashier?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {METHOD_ICON[o.paymentMethod]} {o.paymentMethod}
                  </td>
                  <td className="px-4 py-3 text-right tabular font-semibold">{peso(o.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[o.status] || 'bg-gray-100'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setViewOrder(o)} className="text-xs text-gray-500 hover:text-ink">
                      View receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewOrder && (
        <ReceiptModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onNewSale={() => setViewOrder(null)}
          actionLabel="Close"
        />
      )}
    </AppShell>
  );
}
