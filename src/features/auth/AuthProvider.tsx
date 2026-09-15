import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/api/mock";
import { powers } from "@/entities/user/roles";
import { ROLE_LABELS, type SessionUser } from "@/entities/user/types";
import { loadSession, loadToken, saveSession, saveToken } from "./session";

interface AuthContextValue {
  user: SessionUser | null;
  roleName: string;
  loginError: string;
  pwr: ReturnType<typeof powers>;
  login: (loginValue: string, password: string) => Promise<boolean>;
  quickLogin: (loginValue: string, password: string) => Promise<boolean>;
  logout: (reason?: "manual" | "idle") => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() =>
    loadToken() ? loadSession() : null
  );
  const [loginError, setLoginError] = useState("");

  const setCurrentUser = useCallback((next: SessionUser | null) => {
    setUser(next);
    saveSession(next);
    if (!next) saveToken(null);
  }, []);

  useEffect(() => {
    if (user && loadToken()) {
      void api.refreshRuntime().catch(() => undefined);
    }
  }, [user]);

  const loginWithUser = useCallback(
    (found: SessionUser) => {
      setCurrentUser(found);
      setLoginError("");
    },
    [setCurrentUser]
  );

  const login = useCallback(
    async (loginValue: string, password: string) => {
      const found = await api.authenticate(
        loginValue,
        password,
        "Успешная аутентификация"
      );
      if (!found) {
        setLoginError(
          "Неверный логин или пароль. Используйте тестовые учетные записи из карточек ниже."
        );
        return false;
      }
      loginWithUser(found);
      return true;
    },
    [loginWithUser]
  );

  const quickLogin = useCallback(
    async (loginValue: string, password: string) => {
      const found = await api.authenticate(
        loginValue,
        password,
        "Быстрый вход в демо-прототип"
      );
      if (!found) return false;
      loginWithUser(found);
      return true;
    },
    [loginWithUser]
  );

  const logout = useCallback(
    (reason: "manual" | "idle" = "manual") => {
      if (user) void api.endSession(user, reason);
      else {
        saveToken(null);
      }
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
