import { type ChargenData, type ChargenScanResult } from "@/types/chargen";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface ChargenScan {
  id: string;
  path: string;
  requestedPath: string;
  scannedAt: string;
  data: ChargenData;
}

interface ChargenStore {
  scan: ChargenScan | null;
  setScan: (result: ChargenScanResult, requestedPath: string) => void;
  reset: () => void;
}

export const useChargenStore = create<ChargenStore>()(
  immer((set) => ({
    scan: null,
    setScan: (result, requestedPath) =>
      set((state) => {
        state.scan = {
          id: result.id,
          path: result.path,
          requestedPath,
          scannedAt: new Date().toISOString(),
          data: result.data,
        };
      }),
    reset: () =>
      set((state) => {
        state.scan = null;
      }),
  })),
);
