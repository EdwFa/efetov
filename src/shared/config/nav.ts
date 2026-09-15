import { can, type Permission } from "@/entities/user/roles";
import type { Role } from "@/entities/user/types";

export interface NavItem {
  to: string;
  label: string;
  permission?: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/journal", label: "Общий журнал пациентов" },
  { to: "/files", label: "Файловое хранилище" },
  { to: "/audit", label: "Модуль аудита", permission: "audit.view" },
];

export function visibleNav(role: Role | null | undefined): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => !item.permission || can(role, item.permission)
  );
}
