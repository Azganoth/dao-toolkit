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
  status: "idle" | "scanning" | "generating" | "success" | "error";
  error: string | null;
  setScan: (result: ChargenScanResult, requestedPath: string) => void;
  setStatus: (status: ChargenStore["status"]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useChargenStore = create<ChargenStore>()(
  immer((set) => ({
    scan: null,
    status: "idle",
    error: null,
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
    setStatus: (status) =>
      set((state) => {
        state.status = status;
      }),
    setError: (error) =>
      set((state) => {
        state.error = error;
      }),
    reset: () =>
      set((state) => {
        state.scan = null;
        state.status = "idle";
        state.error = null;
      }),
  })),
);
