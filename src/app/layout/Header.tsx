import { api } from "@/api/mock";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, roleName, logout } = useAuth();
  const { showToast } = useToast();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">Пользователь: {user?.id}</div>
          <div className="font-black">{roleName}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="lg:hidden" onClick={onOpenMenu}>
            Меню
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await api.resetDemoData();
                showToast("Демо-данные сброшены");
              } catch (error) {
                showToast(
                  error instanceof Error ? error.message : "Не удалось сбросить данные"
                );
              }
            }}
          >
            Сбросить демо-данные
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              logout("idle");
              showToast(
                "Сессия завершена из-за неактивности (15 минут по ТЗ)."
              );
            }}
          >
            Timeout 15 мин
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              logout("manual");
            }}
          >
            Выйти
          </Button>
        </div>
      </div>
    </header>
  );
}
