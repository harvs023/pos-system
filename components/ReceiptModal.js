'use client';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

const METHOD_LABEL = { CASH: 'Cash', GCASH: 'GCash', CARD: 'Card' };

export default function ReceiptModal({ order, onClose, onNewSale, actionLabel = 'New sale' }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl2 shadow-panel w-full max-w-sm p-6">
        <div id="receipt-print">
          <div className="text-center mb-4">
            <p className="font-display font-bold text-lg text-ink">Sales Receipt</p>
            <p className="text-xs text-gray-400">Official Receipt No. {order.orderNumber}</p>
            <p className="text-xs text-gray-400">{new Date(order.createdAt || Date.now()).toLocaleString('en-PH')}</p>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 mb-3">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm mb-1">
                <span className="text-ink">
                  {item.name} <span className="text-gray-400">x{item.quantity}</span>
                </span>
                <span className="tabular">{peso(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="tabular">{peso(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Discount</span>
                <span className="tabular">-{peso(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>VAT (12%, included)</span>
              <span className="tabular">{peso(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-ink text-base pt-1">
              <span>Total</span>
              <span className="tabular">{peso(order.total)}</span>
            </div>
            <div className="flex justify-between text-gray-500 pt-1">
              <span>Payment method</span>
              <span>{METHOD_LABEL[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            {order.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Amount tendered</span>
                  <span className="tabular">{peso(order.amountTendered)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Change</span>
                  <span className="tabular">{peso(order.changeDue)}</span>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">Thank you for your purchase!</p>
        </div>

        <div className="flex gap-2 mt-5 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Print
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 py-2.5 rounded-lg bg-peso-500 hover:bg-peso-600 text-white text-sm font-semibold transition"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
