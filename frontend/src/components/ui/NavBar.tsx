"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Health", icon: "🟢" },
  { href: "/inbox", label: "Inbox", icon: "📬" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/config", label: "Config", icon: "⚙️" },
];

export function NavBar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">Premium Auto Analysis</span>
            <span className="text-xs text-gray-400 hidden sm:block">| Signal Intelligence</span>
          </div>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden sm:block">{item.label}</span>
                  {item.label === "Inbox" && pendingCount > 0 && (
                    <span className="bg-brand-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
