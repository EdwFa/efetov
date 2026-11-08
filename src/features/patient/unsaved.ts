let unsaved = false;
const listeners = new Set<() => void>();

export function hasUnsavedChanges(): boolean {
  return unsaved;
}

export function setUnsavedChanges(value: boolean) {
  if (unsaved === value) return;
  unsaved = value;
  listeners.forEach((listener) => listener());
}

export function subscribeUnsaved(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
