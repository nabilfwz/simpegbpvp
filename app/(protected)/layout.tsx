import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/app/components/sidebar";
import { AppSwitcher } from "@/app/components/app-switcher";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 pt-14 md:pt-0 transition-all duration-300 flex flex-col">
        {/* Desktop Header Bar with BPVP Ecosystem App Switcher */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              SIMPEG BPVP Banda Aceh • Kemnaker RI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <AppSwitcher />
            <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200 text-right">
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {session.user?.name}
                </p>
                <p className="text-[10px] text-slate-400 capitalize font-medium">
                  {(session.user as any)?.role === "admin" ? "Administrator" : "Operator Kepegawaian"}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#003399]/10 border border-[#003399]/20 flex items-center justify-center text-[#003399] font-bold text-xs">
                {session.user?.name?.slice(0, 2).toUpperCase() || "BP"}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
