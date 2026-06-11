import type { ConflictScanResult } from "@/types/conflicts";
import { invoke } from "@tauri-apps/api/core";

function scanForResourceConflicts(path: string) {
  return invoke<ConflictScanResult>("scan_for_resource_conflicts", { path });
}

export const conflictsApi = {
  scanForResourceConflicts,
};
