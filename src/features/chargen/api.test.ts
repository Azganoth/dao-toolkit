import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TEST_SCAN_ID } from "@/test/utils/constants";
import { chargenApi } from "./api";

const mockedInvoke = vi.mocked(invoke);

describe("chargen API", () => {
  beforeEach(() => {
    mockedInvoke.mockResolvedValue(undefined);
  });

  it("uses the scan command with the selected path", async () => {
    await chargenApi.scanAssets("D:/DAO/override");

    expect(mockedInvoke).toHaveBeenCalledWith("scan_for_chargen_assets", {
      path: "D:/DAO/override",
    });
  });

  it("uses the generate command with scan snapshot arguments", async () => {
    await chargenApi.generateFile(TEST_SCAN_ID, "D:/DAO/override", [
      "excluded_resource",
    ]);

    expect(mockedInvoke).toHaveBeenCalledWith("generate_chargen_file", {
      scanId: TEST_SCAN_ID,
      path: "D:/DAO/override",
      disabled: ["excluded_resource"],
    });
  });

  it("uses the clear-scan command with the active scan id", async () => {
    await chargenApi.clearScan(TEST_SCAN_ID);

    expect(mockedInvoke).toHaveBeenCalledWith("clear_chargen_scan", {
      scanId: TEST_SCAN_ID,
    });
  });

  it("uses the cleanup command with the maintenance folder path", async () => {
    await chargenApi.deleteFiles("D:/DAO/override");

    expect(mockedInvoke).toHaveBeenCalledWith("delete_all_chargen_files", {
      path: "D:/DAO/override",
    });
  });
});
