import type { SessionUser } from "@/entities/user/types";

const USER_KEY = "efetovSessionUser";
const TOKEN_KEY = "efetovToken";

export function loadSession(): SessionUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null") as SessionUser | null;
  } catch {
    return null;
  }
}

export function saveSession(user: SessionUser | null) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}
