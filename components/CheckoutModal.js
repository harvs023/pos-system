'use client';

import { useState } from 'react';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

const ONLINE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS === 'true';

export default function CheckoutModal({ total, onClose, onConfirm }) {
  const [method, setMethod] = useState('CASH');
  const [tendered, setTendered] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tenderedNum = Number(tendered || 0);
  const change = tenderedNum - total;

  async function handleConfirm() {
    setError('');
    if (method === 'CASH' && tendered !== '' && tenderedNum < total) {
      setError('Amount received is less than the total.');
      return;
    }
    setLoading(true);
    try {
      await onConfirm({
        paymentMethod: method,
        amountTendered: method === 'CASH' ? (tendered === '' ? total : tenderedNum) : undefined,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl2 shadow-panel w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-ink">Checkout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="bg-peso-50 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-peso-700 font-medium">Total due</span>
          <span className="text-2xl font-bold text-peso-700 tabular">{peso(total)}</span>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Payment method</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setMethod('CASH')}
            className={`rounded-lg border py-2.5 text-sm font-medium transition ${
              method === 'CASH' ? 'border-peso-500 bg-peso-50 text-peso-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            💵 Cash
          </button>
          <button
            onClick={() => setMethod('GCASH')}
            className={`rounded-lg border py-2.5 text-sm font-medium transition relative ${
              method === 'GCASH' ? 'border-gcash bg-blue-50 text-gcash' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            📱 GCash
            {!ONLINE_ENABLED && (
              <span className="absolute -top-2 -right-2 text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                test
              </span>
            )}
          </button>
          <button
            onClick={() => setMethod('CARD')}
            className={`rounded-lg border py-2.5 text-sm font-medium transition relative ${
              method === 'CARD' ? 'border-ink bg-gray-100 text-ink' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            💳 Card
            {!ONLINE_ENABLED && (
              <span className="absolute -top-2 -right-2 text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                test
              </span>
            )}
          </button>
        </div>

        {!ONLINE_ENABLED && method !== 'CASH' && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
            Online payments are currently disabled while you're testing the system. Switch to Cash to complete this
            sale, or set <code className="font-mono">NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS=true</code> with real PayMongo
            keys in <code className="font-mono">.env</code> to enable {method === 'GCASH' ? 'GCash' : 'card'} payments.
          </div>
        )}

        {method === 'CASH' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink mb-1">Amount received</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular focus:outline-none focus:ring-2 focus:ring-peso-500"
              placeholder={total.toFixed(2)}
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
            />
            {tendered !== '' && (
              <p className={`text-sm mt-2 tabular ${change < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                Change: {peso(Math.max(change, 0))}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (!ONLINE_ENABLED && method !== 'CASH')}
            className="flex-1 py-2.5 rounded-lg bg-peso-500 hover:bg-peso-600 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Complete sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
