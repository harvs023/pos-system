'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import AppShell from '../../components/AppShell';
import ProductGrid from '../../components/ProductGrid';
import Cart from '../../components/Cart';
import CheckoutModal from '../../components/CheckoutModal';
import ReceiptModal from '../../components/ReceiptModal';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

const VAT_RATE = 0.12;

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]); // [{productId, name, price, quantity}]
  const [showCheckout, setShowCheckout] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]);
    const pData = await pRes.json();
    const cData = await cRes.json();
    setProducts(pData.products || []);
    setCategories(cData.categories || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { productId: product.id, name: product.name, price: Number(product.price), quantity: 1 }];
    });
  }

  function changeQty(productId, qty) {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // Prices shown are VAT-inclusive (standard PH retail display)
  const taxAmount = subtotal - subtotal / (1 + VAT_RATE);
  const total = subtotal;

  async function handleConfirmPayment({ paymentMethod, amountTendered }) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        amountTendered,
        taxInclusive: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to complete sale');
    }

    if (data.checkoutUrl) {
      // GCash: redirect customer to authorize payment
      window.location.href = data.checkoutUrl;
      return;
    }

    setShowCheckout(false);
    setReceiptOrder(data.order);
    setCart([]);
    toast.success('Sale completed!');
    loadData(); // refresh stock counts
  }

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] h-[calc(100vh-56px)]">
        <div className="bg-[#F4F6F8] overflow-hidden flex flex-col">
          {loading ? (
            <p className="p-6 text-sm text-gray-400">Loading products…</p>
          ) : (
            <ProductGrid products={products} categories={categories} onAdd={addToCart} />
          )}
        </div>

        <div className="bg-white border-l border-gray-100 flex flex-col">
          <Cart items={cart} onQtyChange={changeQty} onRemove={removeItem} onClear={() => setCart([])} />

          <div className="border-t border-gray-100 p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="tabular">{peso(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>VAT (12%, included)</span>
              <span className="tabular">{peso(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-ink text-lg pt-1">
              <span>Total</span>
              <span className="tabular">{peso(total)}</span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
              className="w-full bg-peso-500 hover:bg-peso-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              Charge {cart.length > 0 ? peso(total) : ''}
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal total={total} onClose={() => setShowCheckout(false)} onConfirm={handleConfirmPayment} />
      )}

      {receiptOrder && (
        <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} onNewSale={() => setReceiptOrder(null)} />
      )}
    </AppShell>
  );
}
