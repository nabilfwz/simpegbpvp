"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(true);

  const isAdmin = (session?.user as any)?.role === "admin";

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/pegawai", label: "Daftar Pegawai", icon: "👥" },
  ];

  const adminItems = [
    { href: "/admin/master-data", label: "Master Data", icon: "⚙️" },
    { href: "/admin/users", label: "Manajemen User", icon: "👤" },
    { href: "/admin/log-aktivitas", label: "Log Aktivitas", icon: "📋" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#003399] text-white transition-all duration-300 z-40 ${
        open ? "w-64" : "w-20"
      }`}
    >
      <div className="p-4 border-b border-blue-700">
        <button
          onClick={() => setOpen(!open)}
          className="text-2xl hover:bg-blue-700 p-2 rounded-lg w-full text-left"
        >
          ☰
        </button>
      </div>

      <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-100px)]">
        <div className="mb-6">
          <p className={`text-xs uppercase font-semibold opacity-50 mb-3 ${!open ? "hidden" : ""}`}>
            Utama
          </p>
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                isActive(item.href)
                  ? "bg-[#0055cc] text-white"
                  : "hover:bg-blue-700 text-blue-100"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {open && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </div>

        {isAdmin && (
          <div>
            <p className={`text-xs uppercase font-semibold opacity-50 mb-3 ${!open ? "hidden" : ""}`}>
              Admin
            </p>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive(item.href)
                    ? "bg-[#0055cc] text-white"
                    : "hover:bg-blue-700 text-blue-100"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {open && <span className="text-sm">{item.label}</span>}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition text-sm flex items-center justify-center gap-2`}
        >
          <span>🚪</span>
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
