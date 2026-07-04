'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';

export default function AppShell({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('unauthorized');
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      <Navbar user={user} />
      <div className="flex-1 max-w-[1600px] w-full mx-auto">
        {typeof children === 'function' ? children(user) : children}
      </div>
    </div>
  );
}
