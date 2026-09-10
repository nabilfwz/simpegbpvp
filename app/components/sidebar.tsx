"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [pathname, isMobile]);

  const isAdmin = (session?.user as any)?.role === "admin";

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/pegawai", label: "Data Pegawai", icon: "👥" },
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
    <>
      {/* Mobile Overlay */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 text-slate-900 transition-all duration-300 z-40 ${
          open ? "w-64" : "w-20"
        } ${isMobile && !open ? "-translate-x-full" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          {open && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#003399] to-[#0055cc] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">BPVP</span>
              </div>
              <span className="font-bold text-slate-900">SIMPEG</span>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title={open ? "Close" : "Open"}
          >
            {open ? "←" : "→"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-150px)]">
          {/* Main Menu */}
          <div className="mb-6">
            {open && (
              <p className="text-xs uppercase font-semibold text-slate-500 mb-3 px-3">
                Menu Utama
              </p>
            )}
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                    isActive(item.href)
                      ? "bg-blue-50 text-[#003399] border-l-4 border-[#003399] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {open && <span className="text-sm">{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>

          {/* Admin Menu */}
          {isAdmin && (
            <div>
              {open && (
                <p className="text-xs uppercase font-semibold text-slate-500 mb-3 px-3">
                  Administrator
                </p>
              )}
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                      isActive(item.href)
                        ? "bg-blue-50 text-[#003399] border-l-4 border-[#003399] font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    {open && <span className="text-sm">{item.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
          {open && (
            <div className="mb-3 text-xs text-slate-600 truncate">
              <p className="font-semibold text-slate-900">{session?.user?.name}</p>
              <p className="text-slate-500">{(session?.user as any)?.role}</p>
            </div>
          )}
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm h-9 rounded-lg"
          >
            {open ? "🚪 Logout" : "🚪"}
          </Button>
        </div>
      </aside>
    </>
  );
}
