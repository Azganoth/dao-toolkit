import type { ChargenScanResult } from "@/types/chargen";
import { invoke } from "@tauri-apps/api/core";

function scanAssets(path: string) {
  return invoke<ChargenScanResult>("scan_for_chargen_assets", { path });
}

async function generateFile(scanId: string, path: string, disabled: string[]) {
  return invoke<void>("generate_chargen_file", { scanId, path, disabled });
}

async function clearScan(scanId: string) {
  return invoke<void>("clear_chargen_scan", { scanId });
}

async function deleteFiles(path: string) {
  return invoke<number>("delete_all_chargen_files", { path });
}

export const chargenApi = {
  scanAssets,
  generateFile,
  clearScan,
  deleteFiles,
};
