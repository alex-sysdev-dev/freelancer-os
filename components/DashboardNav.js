"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/earnings', label: 'Earnings' },
  { href: '/dashboard/accounts', label: 'Accounts' },
  { href: '/dashboard/transfers', label: 'Transfers' },
  { href: '/dashboard/forecast', label: 'Forecast' },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-tile p-2 border border-[#2f4b70]">
      <ul className="flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-semibold transition-all ${
                  isActive
                    ? 'bg-[#5ec7b7] text-[#041a1a]'
                    : 'bg-[#101a28] text-graphite-faint border border-[#2a3f5d] hover:text-white hover:border-[#5ec7b7]'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
