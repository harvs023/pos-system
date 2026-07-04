'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import AppShell from '../../components/AppShell';

const emptyForm = { name: '', username: '', password: '', role: 'CASHIER' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/users');
    if (res.status === 403) {
      setForbidden(true);
      return;
    }
    const data = await res.json();
    setUsers(data.users || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      toast.success('User created');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleToggle(u) {
    const newRole = u.role === 'ADMIN' ? 'CASHIER' : 'ADMIN';
    const res = await fetch(`/api/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast.success(`${u.name} is now ${newRole === 'ADMIN' ? 'an Admin' : 'a Cashier'}`);
      load();
    } else {
      toast.error('Failed to update role');
    }
  }

  async function handleDelete(u) {
    if (!confirm(`Remove ${u.name}? This can't be undone.`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      toast.success('User removed');
      load();
    } else {
      toast.error(data.error || 'Failed to remove user');
    }
  }

  if (forbidden) {
    return (
      <AppShell>
        <div className="p-6 max-w-2xl mx-auto text-center mt-16">
          <p className="text-lg font-semibold text-ink">Admin access required</p>
          <p className="text-sm text-gray-400 mt-1">Only Admin accounts can manage users.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Users</h1>
            <p className="text-sm text-gray-400">Manage Admin and Cashier accounts</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-peso-500 hover:bg-peso-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            + Add user
          </button>
        </div>

        <div className="bg-white rounded-xl2 shadow-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Username</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => handleRoleToggle(u)} className="text-xs text-gray-500 hover:text-ink mr-3">
                      Make {u.role === 'ADMIN' ? 'Cashier' : 'Admin'}
                    </button>
                    <button onClick={() => handleDelete(u)} className="text-xs text-red-400 hover:text-red-600">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleCreate} className="bg-white rounded-xl2 shadow-panel w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">Add user</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Full name</label>
              <input
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-peso-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Username</label>
              <input
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-peso-500"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Password</label>
              <input
                required
                type="password"
                minLength={6}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-peso-500"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Role</label>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-peso-500"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="CASHIER">Cashier</option>
                <option value="ADMIN">Admin</option>
              </select>
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
                {saving ? 'Saving…' : 'Create user'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
