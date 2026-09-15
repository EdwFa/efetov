import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/mock";
import { ROLE_LABELS } from "@/entities/user/types";
import { Badge, Button, Card, Label, TextInput } from "@/shared/ui";
import { useAuth } from "./useAuth";

export function LoginForm() {
  const { login, loginError } = useAuth();
  const navigate = useNavigate();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const loginValue = (form.elements.namedItem("login") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    if (login(loginValue.trim(), password.trim())) {
      navigate("/journal", { replace: true });
    }
  };

  return (
    <Card className="p-8">
      <Badge tone="green" className="mb-4">
        Кликабельный прототип
      </Badge>
      <h1 className="text-3xl font-black tracking-tight">
        Интерактивная цифровая система поддержки клинического испытания
      </h1>
      <p className="mt-4 text-slate-500">
        Отдельная форма авторизации. Для демонстрации используются три тестовые
        роли с разным набором прав.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="login">Логин</Label>
          <TextInput
            id="login"
            name="login"
            autoComplete="username"
            placeholder="manager"
          />
        </div>
        <div>
          <Label htmlFor="password">Пароль</Label>
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Manager123"
          />
        </div>
        {loginError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {loginError}
          </div>
        ) : null}
        <Button className="w-full" type="submit">
          Войти в систему
        </Button>
      </form>
    </Card>
  );
}

export function QuickRoleCards() {
  const { quickLogin } = useAuth();
  const navigate = useNavigate();
  const users = api.listDemoUsers();

  return (
    <section className="grid gap-4">
      {users.map((item) => (
        <Card key={item.id} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-black">{ROLE_LABELS[item.role]}</div>
              <div className="mt-1 text-sm text-slate-500">
                ID пользователя: {item.id}
              </div>
            </div>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                if (quickLogin(item.login, item.password)) {
                  navigate("/journal", { replace: true });
                }
              }}
            >
              Войти
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="mb-1.5 block text-xs font-bold text-slate-600">
                Логин
              </div>
              <code>{item.login}</code>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="mb-1.5 block text-xs font-bold text-slate-600">
                Пароль
              </div>
              <code>{item.password}</code>
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
