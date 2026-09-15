export const LOCK_FREE = "нет";

export function lockOwnerId(lock: string | undefined): string | null {
  const value = String(lock ?? "").trim();
  if (!value || value === LOCK_FREE) return null;
  const match = value.match(/^редактируется:\s*(.+)$/i);
  return match?.[1]?.trim() || value;
}

export function formatLock(userId: string): string {
  return `редактируется: ${userId}`;
}

export function isLockedByOther(
  lock: string | undefined,
  userId: string | undefined
): boolean {
  const owner = lockOwnerId(lock);
  return Boolean(owner && owner !== userId);
}

export function holdsLock(
  lock: string | undefined,
  userId: string | undefined
): boolean {
  return Boolean(userId && lockOwnerId(lock) === userId);
}
