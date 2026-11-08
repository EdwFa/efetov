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
import { setUnauthorizedHandler } from "@/api/http";
import { powers } from "@/entities/user/roles";
import { ROLE_LABELS, type SessionUser } from "@/entities/user/types";
import { hasUnsavedChanges } from "@/features/patient/unsaved";
import { useToast } from "@/shared/ui/toast";
import { loadSession, loadToken, saveSession, saveToken } from "./session";

interface AuthContextValue {
  user: SessionUser | null;
  roleName: string;
  loginError: string;
  pwr: ReturnType<typeof powers>;
  login: (loginValue: string, password: string) => Promise<boolean>;
  quickLogin: (loginValue: string, password: string) => Promise<boolean>;
  logout: (reason?: "manual" | "idle") => void;
  applyRole: (role: SessionUser["role"]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() =>
    loadToken() ? loadSession() : null
  );
  const [loginError, setLoginError] = useState("");
  const { showToast } = useToast();

  const setCurrentUser = useCallback((next: SessionUser | null) => {
    setUser(next);
    saveSession(next);
    if (!next) saveToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((message) => {
      const dirty = hasUnsavedChanges();
      setCurrentUser(null);
      setLoginError("");
      if (message === "Нужна авторизация") return;
      if (dirty && message.includes("неактивности")) {
        showToast(
          "Сессия завершена из-за неактивности (15 минут). Несохранённые изменения не записаны."
        );
        return;
      }
      showToast(message);
    });
    return () => setUnauthorizedHandler(null);
  }, [setCurrentUser, showToast]);

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

  const signIn = useCallback(
    async (loginValue: string, password: string) => {
      try {
        const found = await api.authenticate(
          loginValue,
          password,
          "Успешная аутентификация"
        );
        if (!found) {
          setLoginError("Неверный логин или пароль.");
          return false;
        }
        loginWithUser(found);
        return true;
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : "Неверный логин или пароль.");
        return false;
      }
    },
    [loginWithUser]
  );

  const login = useCallback(
    (loginValue: string, password: string) => signIn(loginValue, password),
    [signIn]
  );

  const quickLogin = useCallback(
    (loginValue: string, password: string) => signIn(loginValue, password),
    [signIn]
  );

  const applyRole = useCallback(
    (role: SessionUser["role"]) => {
      if (!user || user.role === role) return;
      setCurrentUser({ ...user, role });
    },
    [setCurrentUser, user]
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
      roleName: user ? ROLE_LABELS[user.role] ?? "Роль не назначена" : "Не авторизован",
      loginError,
      pwr: powers(user?.role),
      login,
      quickLogin,
      logout,
      applyRole,
    }),
    [user, loginError, login, quickLogin, logout, applyRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
