import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { IdleTimeout } from "./IdleTimeout";
import { Sidebar } from "./Sidebar";
import { Toast } from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

export function AppShell() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const { toast } = useToast();

  return (
    <div className="flex min-h-screen">
      <IdleTimeout />
      <aside className="hidden w-72 bg-slate-950 p-5 text-white lg:block">
        <Sidebar />
      </aside>
      {mobileMenu ? (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden"
          onClick={() => setMobileMenu(false)}
        >
          <aside
            className="h-full w-72 bg-slate-950 p-5 text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <Sidebar onNavigate={() => setMobileMenu(false)} />
          </aside>
        </div>
      ) : null}
      <main className="min-w-0 flex-1">
        <Header onOpenMenu={() => setMobileMenu(true)} />
        <section className="p-5 lg:p-7">
          <Outlet />
        </section>
      </main>
      <Toast message={toast} />
    </div>
  );
}
