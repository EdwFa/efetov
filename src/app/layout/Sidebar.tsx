import { NavLink } from "react-router-dom";
import { visibleNav } from "@/shared/config/nav";
import { APP_MARK, APP_NAME } from "@/shared/config/brand";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/useAuth";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, roleName } = useAuth();
  const items = visibleNav(user?.role);

  return (
    <>
      <div className="text-xs font-black uppercase tracking-widest text-teal-300">
        {APP_MARK}
      </div>
      <div className="mt-3 text-xl font-black">{APP_NAME}</div>
      <div className="mt-5 rounded-2xl bg-white/10 p-4">
        <div className="text-xs text-slate-400">Текущая роль</div>
        <div className="mt-1 font-black">{roleName}</div>
        <div className="mt-1 text-xs text-slate-400">
          {user?.id} · {user?.login}
        </div>
      </div>
      <nav className="mt-6 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left font-bold text-slate-300 hover:bg-white/10 hover:text-white",
                isActive && "bg-teal-700 text-white hover:bg-teal-700 hover:text-white"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-8 rounded-2xl bg-white/5 p-4 text-xs leading-5 text-slate-400">
        <b className="text-slate-300">Разграничение по ТЗ</b>
        <br />
        Врачи видят журнал и хранилище. Модуль аудита и выгрузки доступны только
        руководителю.
      </div>
    </>
  );
}
