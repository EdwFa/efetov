export type Role = "leader" | "stationary" | "ambulatory";

export interface DemoUser {
  login: string;
  password: string;
  role: Role;
  id: string;
  name: string;
}

export interface SessionUser {
  login: string;
  role: Role;
  id: string;
  name: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  leader: "Руководитель исследования",
  stationary: "Врач стационара",
  ambulatory: "Врач амбулатории",
};
