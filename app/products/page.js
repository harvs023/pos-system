'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import AppShell from '../../components/AppShell';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

const emptyForm = { id: null, name: '', sku: '', price: '', cost: '', stock: '', categoryId: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockDelta, setRestockDelta] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [restockSaving, setRestockSaving] = useState(false);
  const [movements, setMovements] = useState([]);

  const loadMovements = useCallback(async () => {
    const res = await fetch('/api/stock-movements');
    const data = await res.json();
    setMovements(data.movements || []);
  }, []);

  const load = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]);
    setProducts((await pRes.json()).products || []);
    setCategories((await cRes.json()).categories || []);
  }, []);

  useEffect(() => {
    load();
    loadMovements();
  }, [load, loadMovements]);

  function openNew() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      cost: p.cost ?? '',
      stock: p.stock,
      categoryId: p.categoryId ?? '',
    });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        price: Number(form.price),
        cost: form.cost === '' ? null : Number(form.cost),
        stock: Number(form.stock || 0),
        categoryId: form.categoryId === '' ? null : Number(form.categoryId),
      };
      const res = await fetch(form.id ? `/api/products/${form.id}` : '/api/products', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');
      toast.success(form.id ? 'Product updated' : 'Product added');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(p) {
    if (!confirm(`Deactivate "${p.name}"? It will be hidden from the terminal but kept in sales history.`)) return;
    const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Product deactivated');
      load();
    } else {
      toast.error('Failed to deactivate product');
    }
  }

  function openRestock(p) {
    setRestockProduct(p);
    setRestockDelta('');
    setRestockNote('');
  }

  async function handleRestockSubmit(e) {
    e.preventDefault();
    const delta = Number(restockDelta);
    if (!delta) {
      toast.error('Enter a quantity (e.g. 50 to add, -3 to remove)');
      return;
    }
    setRestockSaving(true);
    try {
      const res = await fetch(`/api/products/${restockProduct.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta, note: restockNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock');
      toast.success(`Stock ${delta > 0 ? 'added' : 'adjusted'} for ${restockProduct.name}`);
      setRestockProduct(null);
      load();
      loadMovements();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRestockSaving(false);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to add category');
      return;
    }
    setNewCategory('');
    load();
  }

  async function handleDeleteCategory(c) {
    if (!confirm(`Delete category "${c.name}"? Products in it will become uncategorized (not deleted).`)) return;
    const res = await fetch(`/api/categories/${c.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Category deleted');
      load();
    } else {
      toast.error('Failed to delete category');
    }
  }

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Products &amp; Inventory</h1>
            <p className="text-sm text-gray-400">{products.length} products</p>
          </div>
          <button
            onClick={openNew}
            className="bg-peso-500 hover:bg-peso-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            + Add product
          </button>
        </div>

        <div className="bg-white rounded-xl2 shadow-panel overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">SKU</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-right px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className={!p.isActive ? 'opacity-40' : ''}>
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-right tabular">{peso(p.price)}</td>
                  <td className={`px-4 py-3 text-right tabular ${p.stock <= 5 ? 'text-amber-500 font-semibold' : ''}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-peso-50 text-peso-600' : 'bg-gray-100 text-gray-400'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openRestock(p)} className="text-xs text-peso-600 hover:text-peso-700 mr-3">
                      Restock
                    </button>
                    <button onClick={() => openEdit(p)} className="text-xs text-gray-500 hover:text-ink mr-3">
                      Edit
                    </button>
                    {p.isActive && (
                      <button onClick={() => handleDeactivate(p)} className="text-xs text-red-400 hover:text-red-600">
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No products yet. Add your first one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl2 shadow-panel p-5">
            <h2 className="font-display font-bold text-ink mb-3">Categories</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 pl-3 pr-1.5 py-1 rounded-full"
                >
                  {c.name}
                  <button
                    onClick={() => handleDeleteCategory(c)}
                    title={`Delete ${c.name}`}
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-300 hover:text-gray-800 transition"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {categories.length === 0 && <p className="text-xs text-gray-400">No categories yet.</p>}
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-peso-500"
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-ink text-white text-sm font-medium">
                Add
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl2 shadow-panel p-5">
            <h2 className="font-display font-bold text-ink mb-3">Stock history</h2>
            {movements.length === 0 ? (
              <p className="text-xs text-gray-400">No restocks or adjustments logged yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {movements.map((m) => (
                  <li key={m.id} className="py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-ink font-medium">{m.product?.name}</span>
                      <span className={`tabular font-semibold ${m.quantity > 0 ? 'text-peso-600' : 'text-red-500'}`}>
                        {m.quantity > 0 ? '+' : ''}
                        {m.quantity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(m.createdAt).toLocaleString('en-PH')} · {m.user?.name || 'System'}
                      {m.note ? ` · ${m.note}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSave} className="bg-white rounded-xl2 shadow-panel w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">{form.id ? 'Edit product' : 'Add product'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Product name</label>
              <input
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-peso-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">SKU</label>
                <input
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-peso-500"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Category</label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-peso-500"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Price (₱)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular focus:outline-none focus:ring-2 focus:ring-peso-500"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Cost (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular focus:outline-none focus:ring-2 focus:ring-peso-500"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular focus:outline-none focus:ring-2 focus:ring-peso-500"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-peso-500 hover:bg-peso-600 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save product'}
              </button>
            </div>
          </form>
        </div>
      )}
      {restockProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleRestockSubmit} className="bg-white rounded-xl2 shadow-panel w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">Update stock</h2>
              <button type="button" onClick={() => setRestockProduct(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {restockProduct.name} — currently <span className="font-semibold text-ink tabular">{restockProduct.stock}</span> in
              stock
            </p>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Quantity</label>
              <input
                autoFocus
                type="number"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular focus:outline-none focus:ring-2 focus:ring-peso-500"
                placeholder="e.g. 50 to add, -3 to remove"
                value={restockDelta}
                onChange={(e) => setRestockDelta(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Use a positive number for new stock received, negative for damage/loss/correction.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Note (optional)</label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-peso-500"
                placeholder="e.g. Delivery from supplier, damaged in transit…"
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={restockSaving}
                className="flex-1 py-2.5 rounded-lg bg-peso-500 hover:bg-peso-600 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                {restockSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
