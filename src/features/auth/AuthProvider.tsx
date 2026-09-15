import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { api } from "@/api/mock";
import { powers } from "@/entities/user/roles";
import { ROLE_LABELS, type SessionUser } from "@/entities/user/types";
import { loadSession, saveSession } from "./session";

interface AuthContextValue {
  user: SessionUser | null;
  roleName: string;
  loginError: string;
  pwr: ReturnType<typeof powers>;
  login: (loginValue: string, password: string) => boolean;
  quickLogin: (loginValue: string, password: string) => boolean;
  logout: (reason?: "manual" | "idle") => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(loadSession);
  const [loginError, setLoginError] = useState("");

  const setCurrentUser = useCallback((next: SessionUser | null) => {
    setUser(next);
    saveSession(next);
  }, []);

  const loginWithUser = useCallback(
    (found: SessionUser, details: string) => {
      setCurrentUser(found);
      setLoginError("");
      api.addAudit(found, "Вход в систему", details);
    },
    [setCurrentUser]
  );

  const login = useCallback(
    (loginValue: string, password: string) => {
      const found = api.authenticate(loginValue, password);
      if (!found) {
        setLoginError(
          "Неверный логин или пароль. Используйте тестовые учетные записи из карточек ниже."
        );
        return false;
      }
      loginWithUser(found, "Успешная аутентификация");
      return true;
    },
    [loginWithUser]
  );

  const quickLogin = useCallback(
    (loginValue: string, password: string) => {
      const found = api.authenticate(loginValue, password);
      if (!found) return false;
      loginWithUser(found, "Быстрый вход в демо-прототип");
      return true;
    },
    [loginWithUser]
  );

  const logout = useCallback(
    (reason: "manual" | "idle" = "manual") => {
      if (user) api.endSession(user, reason);
      setCurrentUser(null);
      setLoginError("");
    },
    [setCurrentUser, user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      roleName: user ? ROLE_LABELS[user.role] : "Не авторизован",
      loginError,
      pwr: powers(user?.role),
      login,
      quickLogin,
      logout,
    }),
    [user, loginError, login, quickLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
