"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/app/components/ui/button";
import { BrandLogo } from "@/app/components/brand-logo";
import { AppSwitcher } from "@/app/components/app-switcher";
import { isAdminRole, hasAdminAccess, getRoleLabel } from "@/lib/constants";

const masterDataSubmenus = [
  { href: "/admin/master-data?group=kepegawaian", group: "kepegawaian", label: "Pangkat & Status", icon: "🎖️" },
  { href: "/admin/master-data?group=organisasi", group: "organisasi", label: "Unit Kerja & Balai", icon: "🏢" },
  { href: "/admin/master-data?group=wilayah", group: "wilayah", label: "Wilayah", icon: "🗺️" },
  { href: "/admin/master-data?group=demografi", group: "demografi", label: "Demografi", icon: "👤" },
];

function MasterDataSubmenuItems({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const currentGroup = searchParams.get("group") || "kepegawaian";
  const isMasterDataPage = pathname === "/admin/master-data";

  return (
    <div className="ml-5 pl-2.5 border-l-2 border-slate-200 mt-1 space-y-0.5 py-0.5">
      {masterDataSubmenus.map((sub) => {
        const isSubActive = isMasterDataPage && currentGroup === sub.group;
        return (
          <Link
            key={sub.group}
            href={sub.href}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              isSubActive
                ? "bg-blue-50 text-[#003399] font-bold shadow-2xs border border-blue-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="text-sm shrink-0">{sub.icon}</span>
            <span className="truncate">{sub.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [masterDataOpen, setMasterDataOpen] = useState(pathname.startsWith("/admin/master-data"));

  // Keep master data submenu open when on master data page
  useEffect(() => {
    if (pathname.startsWith("/admin/master-data")) {
      setMasterDataOpen(true);
    }
  }, [pathname]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const userRole = (session?.user as any)?.role;
  const isAdmin = isAdminRole(userRole);
  const canAccessAdmin = hasAdminAccess(userRole);
  const [trashCount, setTrashCount] = useState<number>(0);

  // Fetch trash count for admin badge
  useEffect(() => {
    if (canAccessAdmin) {
      fetch("/api/tong-sampah?countOnly=true")
        .then((res) => res.json())
        .then((data) => {
          if (data?.total !== undefined) {
            setTrashCount(data.total);
          }
        })
        .catch(() => {});
    }
  }, [canAccessAdmin, pathname]);

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/pegawai", label: "Data Pegawai", icon: "👥" },
  ];

  // Menu admin umum: superadmin + admin
  const adminItems = [
    { href: "/admin/master-data", label: "Master Data", icon: "⚙️", isMasterData: true },
    { href: "/admin/users", label: "Manajemen User", icon: "👤", superadminOnly: true },
    { href: "/admin/log-aktivitas", label: "Log Aktivitas", icon: "📋" },
    { href: "/admin/tong-sampah", label: "Tong Sampah", icon: "🗑️", badge: trashCount },
  ];

  // Filter menu sesuai role
  const visibleAdminItems = adminItems.filter(
    (item) => !item.superadminOnly || isAdmin
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Topbar (Visible on screens < 768px, Burger on LEFT) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-3 shadow-xs">
        {/* Left: Burger Button & Brand Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition active:scale-95 shrink-0"
            aria-label="Buka Menu Navigasi"
          >
            <span className="text-xl leading-none">☰</span>
          </button>
          <BrandLogo size="sm" showText={true} />
        </div>

        {/* Right: AppSwitcher & User Avatar Pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <AppSwitcher />
          {session?.user && (
            <div
              className="w-8 h-8 rounded-full bg-[#003399]/10 border border-[#003399]/20 flex items-center justify-center text-[#003399] font-bold text-xs uppercase shadow-2xs"
              title={session.user.name || "User"}
            >
              {session.user.name?.slice(0, 2) || "BP"}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Backdrop Overlay with blur */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 cursor-pointer backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Fixed on left, sleek responsive drawer on mobile) */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 text-slate-900 transition-all duration-300 z-50 md:z-30 flex flex-col shadow-xl md:shadow-none ${
          desktopCollapsed ? "md:w-20" : "md:w-64"
        } w-72 max-w-[82vw] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 border-b border-slate-200 h-16 bg-slate-50/50">
          <BrandLogo size="sm" showText={!desktopCollapsed || mobileOpen} />
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileOpen(false);
              } else {
                setDesktopCollapsed(!desktopCollapsed);
              }
            }}
            className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition shrink-0 ml-1"
            title={desktopCollapsed ? "Perluas Sidebar" : "Perkecil / Tutup Sidebar"}
          >
            {mobileOpen ? (
              <span className="text-xl font-bold leading-none px-1">&times;</span>
            ) : desktopCollapsed ? (
              "→"
            ) : (
              "←"
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-6 flex-1 overflow-y-auto">
          {/* Main Menu */}
          <div>
            {(!desktopCollapsed || mobileOpen) && (
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2 px-3">
                Menu Utama
              </p>
            )}
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium ${
                      active
                        ? "bg-blue-50 text-[#003399] font-semibold shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    {(!desktopCollapsed || mobileOpen) && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Admin Menu — tampil untuk superadmin & admin */}
          {canAccessAdmin && (
            <div>
              {(!desktopCollapsed || mobileOpen) && (
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2 px-3">
                  Administrator
                </p>
              )}
              <div className="space-y-1">
                {visibleAdminItems.map((item) => {
                  const active = isActive(item.href);

                  if (item.isMasterData) {
                    return (
                      <div key={item.href}>
                        <div className="flex items-center">
                          <Link
                            href={item.href}
                            className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium ${
                              active
                                ? "bg-blue-50 text-[#003399] font-semibold shadow-xs"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span className="text-lg flex-shrink-0">{item.icon}</span>
                            {(!desktopCollapsed || mobileOpen) && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </Link>
                          {(!desktopCollapsed || mobileOpen) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setMasterDataOpen(!masterDataOpen);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-700 transition rounded-lg hover:bg-slate-100 ml-0.5"
                              title={masterDataOpen ? "Tutup Submenu" : "Buka Submenu"}
                            >
                              <span
                                className={`inline-block text-[10px] transition-transform duration-200 ${
                                  masterDataOpen ? "rotate-90 text-[#003399]" : ""
                                }`}
                              >
                                ▶
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Master Data Submenu Accordion */}
                        {masterDataOpen && (!desktopCollapsed || mobileOpen) && (
                          <Suspense fallback={null}>
                            <MasterDataSubmenuItems pathname={pathname} />
                          </Suspense>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium ${
                        active
                          ? "bg-blue-50 text-[#003399] font-semibold shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      {(!desktopCollapsed || mobileOpen) && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate">{item.label}</span>
                          {(item as any).badge !== undefined && (item as any).badge > 0 && (
                            <span className="ml-2 px-2 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-extrabold rounded-full border border-rose-300">
                              {(item as any).badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Footer with User Info & Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          {(!desktopCollapsed || mobileOpen) && session?.user && (
            <div className="mb-3 px-2 py-1 truncate">
              <p className="font-semibold text-slate-900 text-sm truncate">{session.user.name}</p>
              <p className="text-xs text-slate-500 capitalize font-medium">
                {getRoleLabel((session.user as any)?.role)}
              </p>
            </div>
          )}
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold h-9 rounded-lg transition flex items-center justify-center gap-2 shadow-xs"
          >
            <span>🚪</span>
            {(!desktopCollapsed || mobileOpen) && <span>Keluar</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
