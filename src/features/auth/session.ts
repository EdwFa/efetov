import type { SessionUser } from "@/entities/user/types";

const USER_KEY = "efetovSessionUser";

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
