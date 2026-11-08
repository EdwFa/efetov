import { useEffect, useState } from "react";
import { api } from "@/api/mock";
import { tryApi } from "@/api/errors";
import type { AccountProfileInput, AccountRecord, AssignableRole } from "@/entities/user/types";
import {
  CreateAccountDialog,
  EditAccountDialog,
  PasswordDialog,
} from "@/features/admin/AccountForms";
import { useAuth } from "@/features/auth/useAuth";
import { Badge, Button, PageHeader } from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

const ROLE_COLUMNS: Array<{ role: AssignableRole; label: string }> = [
  { role: "stationary", label: "Врач стационара" },
  { role: "ambulatory", label: "Врач амбулатории" },
  { role: "leader", label: "Руководитель" },
];

export function AdminPage() {
  const { user, applyRole } = useAuth();
  const { showToast } = useToast();
  const [rows, setRows] = useState<AccountRecord[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AccountRecord | null>(null);
  const [passwordFor, setPasswordFor] = useState<AccountRecord | null>(null);

  useEffect(() => {
    if (!user) return;
    void api.listAccounts(user).then(setRows).catch((error: unknown) => {
      showToast(error instanceof Error ? error.message : "Не удалось открыть список пользователей");
    });
  }, [user, showToast]);

  const toggle = (account: AccountRecord, role: AssignableRole) => {
    if (!user || pendingId) return;
    const roles = account.roles.includes(role)
      ? account.roles.filter((item) => item !== role)
      : [...account.roles, role];
    setPendingId(account.id);
    void (async () => {
      try {
        const saved = await tryApi(
          () => api.updateAccountRoles(user, account.id, roles),
          (error) => showToast(error.message)
        );
        if (!saved.ok) return;
        setRows((current) =>
          current.map((item) => (item.id === saved.value.id ? saved.value : item))
        );
        if (saved.value.id === user.id && saved.value.role) applyRole(saved.value.role);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Не удалось сохранить права");
      } finally {
        setPendingId(null);
      }
    })();
  };

  const replaceRow = (saved: AccountRecord) => {
    setRows((current) => {
      const exists = current.some((item) => item.id === saved.id);
      const next = exists
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved];
      return next.sort((left, right) => left.id.localeCompare(right.id));
    });
  };

  const createAccount = async (
    input: AccountProfileInput & { password: string; passwordRepeat: string }
  ) => {
    if (!user) return;
    const saved = await api.createAccount(user, input);
    replaceRow(saved);
    setCreating(false);
    showToast("Учётная запись создана");
  };

  const saveAccount = async (input: AccountProfileInput) => {
    if (!user || !editing) return;
    const saved = await api.updateAccount(user, editing.id, input);
    replaceRow(saved);
    setEditing(null);
    showToast("Учётная запись сохранена");
  };

  const changeStatus = async (
    account: AccountRecord,
    action: () => Promise<AccountRecord>
  ) => {
    if (!user) return;
    setPendingId(account.id);
    try {
      const saved = await tryApi(action, (error) => showToast(error.message));
      if (!saved.ok) return;
      replaceRow(saved.value);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось изменить учётную запись");
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (account: AccountRecord) => {
    if (!user) return;
    setPendingId(account.id);
    try {
      const saved = await tryApi(
        () => api.removeAccount(user, account.id),
        (error) => showToast(error.message)
      );
      if (!saved.ok) return;
      setRows((current) => current.filter((item) => item.id !== account.id));
      showToast("Учётная запись удалена из списка");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось удалить учётную запись");
    } finally {
      setPendingId(null);
    }
  };

  const savePassword = async (input: { password: string; passwordRepeat: string }) => {
    if (!user || !passwordFor) return;
    const saved = await api.changeAccountPassword(user, passwordFor.id, input);
    replaceRow(saved);
    setPasswordFor(null);
    showToast("Пароль изменён");
  };

  return (
    <>
      <PageHeader
        title="Администрирование"
        description="Зарегистрированные учётные записи и назначенные роли."
      />
      <div className="mb-4">
        <Button type="button" onClick={() => setCreating(true)}>
          Добавить пользователя
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left font-extrabold text-slate-600" rowSpan={2}>
                  ФИО
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left font-extrabold text-slate-600" rowSpan={2}>
                  УЗ
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center font-extrabold text-slate-600" colSpan={3}>
                  Назначенные права
                </th>
                <th className="sticky right-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-3 text-left font-extrabold text-slate-600 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.35)]" rowSpan={2}>
                  Действия
                </th>
              </tr>
              <tr>
                {ROLE_COLUMNS.map((column) => (
                  <th
                    key={column.role}
                    className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-center font-extrabold text-slate-600"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((account) => (
                <tr key={account.id} className="group hover:bg-slate-50">
                  <td className="border-b border-slate-200 px-3 py-3 font-bold">
                    <div>{account.name}</div>
                    {account.blocked ? (
                      <Badge tone="red" className="mt-1">
                        Заблокирована
                      </Badge>
                    ) : null}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3">{account.login}</td>
                  {ROLE_COLUMNS.map((column) => (
                    <td key={column.role} className="border-b border-slate-200 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-teal-700"
                        checked={account.roles.includes(column.role)}
                        disabled={pendingId === account.id}
                        aria-label={`${account.name}, ${column.label}`}
                        onChange={() => toggle(account, column.role)}
                      />
                    </td>
                  ))}
                  <td className="sticky right-0 z-10 border-b border-slate-200 bg-white px-3 py-3 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.35)] group-hover:bg-slate-50">
                    <div className="flex w-52 flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => setEditing(account)}>
                        Изменить
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setPasswordFor(account)}>
                        Сменить пароль
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={pendingId === account.id || account.blocked || account.id === user?.id}
                        onClick={() =>
                          void changeStatus(account, () => api.blockAccount(user!, account.id))
                        }
                      >
                        Заблокировать
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={pendingId === account.id || !account.blocked}
                        onClick={() =>
                          void changeStatus(account, () => api.unblockAccount(user!, account.id))
                        }
                      >
                        Разблокировать
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={pendingId === account.id || account.id === user?.id}
                        onClick={() => void remove(account)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">
        Несколько ролей сохраняются. Пока их сочетание не согласовано, действуют
        права одной роли: текущей, если она остаётся отмеченной, либо единственной
        выбранной.
      </p>
      {creating ? (
        <CreateAccountDialog onClose={() => setCreating(false)} onSubmit={createAccount} />
      ) : null}
      {editing ? (
        <EditAccountDialog
          account={editing}
          onClose={() => setEditing(null)}
          onSubmit={saveAccount}
        />
      ) : null}
      {passwordFor ? (
        <PasswordDialog
          account={passwordFor}
          onClose={() => setPasswordFor(null)}
          onSubmit={savePassword}
        />
      ) : null}
    </>
  );
}
