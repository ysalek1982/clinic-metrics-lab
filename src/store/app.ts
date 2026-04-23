import { create } from "zustand";
import type { PackId } from "@/types/domain";
import { DEMO_ORG } from "@/data/demo";

interface AppState {
  activePack: PackId | "all";
  setActivePack: (p: PackId | "all") => void;
  org: typeof DEMO_ORG;
}

export const useAppStore = create<AppState>((set) => ({
  activePack: "all",
  setActivePack: (p) => set({ activePack: p }),
  org: DEMO_ORG,
}));
