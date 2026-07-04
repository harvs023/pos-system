'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const baseLinks = [
  { href: '/pos', label: 'Terminal' },
  { href: '/products', label: 'Products' },
  { href: '/orders', label: 'Orders' },
  { href: '/dashboard', label: 'Dashboard' },
];

const adminLinks = [{ href: '/users', label: 'Users' }];

export default function Navbar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = user?.role === 'ADMIN' ? [...baseLinks, ...adminLinks] : baseLinks;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="bg-ink text-white">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-display font-bold">
            <span className="w-7 h-7 rounded-lg bg-peso-500 flex items-center justify-center text-sm">₱</span>
            POS
          </div>
          <div className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === l.href ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-slate-300">
              {user.name} <span className="text-slate-500">· {user.role}</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
