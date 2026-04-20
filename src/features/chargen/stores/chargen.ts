import { type ChargenData } from "@/types/chargen";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ChargenStore {
  path: string | null;
  data: ChargenData | null;
  status: "idle" | "scanning" | "generating" | "success" | "error";
  error: string | null;
  setData: (data: ChargenData) => void;
  setPath: (path: string) => void;
  setStatus: (status: ChargenStore["status"]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useChargenStore = create<ChargenStore>()(
  immer((set) => ({
    path: null,
    data: null,
    status: "idle",
    error: null,
    setData: (data) =>
      set((state) => {
        state.data = data;
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
        state.data = null;
        state.status = "idle";
        state.error = null;
      }),
  })),
);
