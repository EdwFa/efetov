export function returnPathFromState(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  if (typeof from !== "string") return "/journal";
  if (!from.startsWith("/") || from.startsWith("//") || from.includes("\\")) {
    return "/journal";
  }
  if (from === "/login" || from.startsWith("/login/")) return "/journal";
  return from;
}
