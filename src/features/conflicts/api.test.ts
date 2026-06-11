import { invoke } from "@tauri-apps/api/core";
import { describe, expect, it, vi } from "vitest";

import { conflictsApi } from "./api";

const mockedInvoke = vi.mocked(invoke);

describe("conflicts API", () => {
  it("uses the resource-conflict scan command with the selected path", async () => {
    await conflictsApi.scanForResourceConflicts("D:/DAO");

    expect(mockedInvoke).toHaveBeenCalledWith("scan_for_resource_conflicts", {
      path: "D:/DAO",
    });
  });
});
