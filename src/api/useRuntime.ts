import { useSyncExternalStore } from "react";
import { api } from "@/api/mock";

export function useRuntime() {
  return useSyncExternalStore(api.subscribe, api.getRuntime, api.getRuntime);
}
