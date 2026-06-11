import type { ConflictScanResult } from "@/types/conflicts";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface ConflictScan extends ConflictScanResult {
  scannedAt: string;
}

interface ConflictsStore {
  scan: ConflictScan | null;
  setScan: (result: ConflictScanResult) => void;
  reset: () => void;
}

export const useConflictsStore = create<ConflictsStore>()(
  immer((set) => ({
    scan: null,
    setScan: (result) =>
      set((state) => {
        state.scan = {
          ...result,
          scannedAt: new Date().toISOString(),
        };
      }),
    reset: () =>
      set((state) => {
        state.scan = null;
      }),
  })),
);
