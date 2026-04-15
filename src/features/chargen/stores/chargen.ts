import { type ChargenManifest, type ChargenStats } from "@/types/chargen";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ChargenStore {
  path: string | null;
  stats: ChargenStats | null;
  manifest: ChargenManifest | null;
  status: "idle" | "scanning" | "generating" | "success" | "error";
  error: string | null;
  setStats: (stats: ChargenStats, manifest: ChargenManifest) => void;
  setPath: (path: string) => void;
  setStatus: (status: ChargenStore["status"]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useChargenStore = create<ChargenStore>()(
  immer((set) => ({
    path: null,
    stats: null,
    manifest: null,
    status: "idle",
    error: null,
    setStats: (stats, manifest) =>
      set((state) => {
        state.stats = stats;
        state.manifest = manifest;
      }),
    setPath: (path) =>
      set((state) => {
        state.path = path;
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
        state.path = null;
        state.stats = null;
        state.manifest = null;
        state.status = "idle";
        state.error = null;
      }),
  })),
);
