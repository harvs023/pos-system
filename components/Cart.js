'use client';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

export default function Cart({ items, onQtyChange, onRemove, onClear }) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6">
        <div>
          <p className="text-gray-400 text-sm">Cart is empty</p>
          <p className="text-gray-300 text-xs mt-1">Tap a product to add it to the sale</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4">
      <div className="flex items-center justify-between py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Current Sale</h3>
        <button onClick={onClear} className="text-xs text-red-500 hover:text-red-600">
          Clear all
        </button>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.productId} className="py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{item.name}</p>
              <p className="text-xs text-gray-400 tabular">{peso(item.price)} each</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onQtyChange(item.productId, item.quantity - 1)}
                className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium"
              >
                −
              </button>
              <span className="w-6 text-center text-sm tabular">{item.quantity}</span>
              <button
                onClick={() => onQtyChange(item.productId, item.quantity + 1)}
                className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium"
              >
                +
              </button>
            </div>
            <div className="w-16 text-right text-sm font-semibold tabular">{peso(item.price * item.quantity)}</div>
            <button onClick={() => onRemove(item.productId)} className="text-gray-300 hover:text-red-500 text-sm">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
