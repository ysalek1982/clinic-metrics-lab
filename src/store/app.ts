import { create } from "zustand";
import type { PackId } from "@/types/domain";

const ACTIVE_TENANT_STORAGE_KEY = "nutri.activeTenantId";

function readStoredTenantId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
}

function writeStoredTenantId(tenantId: string | null) {
  if (typeof window === "undefined") return;

  if (tenantId) {
    window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, tenantId);
    return;
  }

  window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
}

interface AppState {
  activePack: PackId | "all";
  activeTenantId: string | null;
  setActivePack: (packId: PackId | "all") => void;
  setActiveTenant: (tenantId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activePack: "all",
  activeTenantId: readStoredTenantId(),
  setActivePack: (packId) => set({ activePack: packId }),
  setActiveTenant: (tenantId) => {
    writeStoredTenantId(tenantId);
    set({ activeTenantId: tenantId });
  },
}));
