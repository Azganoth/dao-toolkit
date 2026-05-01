import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import {
  createChargenData,
  createChargenScanResult,
  setActiveChargenScan,
} from "@/test/utils/chargen";
import {
  TEST_OVERRIDE_PATH,
  TEST_SCAN_ID,
  TEST_TOAST_ID,
} from "@/test/utils/constants";
import { renderWithUser, screen } from "@/test/utils/react";
import { resetAppStores } from "@/test/utils/stores";

vi.mock("@/features/chargen/api", () => ({
  chargenApi: {
    clearScan: vi.fn(),
    deleteFiles: vi.fn(),
    generateFile: vi.fn(),
    scanAssets: vi.fn(),
  },
}));

vi.mock("./components/ChargenSummary", () => ({
  ChargenSummary: ({ scanPath }: { scanPath: string }) => (
    <section aria-label="chargen summary">Summary for {scanPath}</section>
  ),
}));

vi.mock("./components/ChargenStaleExclusions", () => ({
  ChargenStaleExclusions: ({
    names,
    open,
  }: {
    names: string[];
    open: boolean;
  }) =>
    open ? (
      <section aria-label="stale exclusions dialog">
        {names.map((name) => (
          <p key={name}>{name}</p>
        ))}
      </section>
    ) : null,
}));

import { chargenApi } from "@/features/chargen/api";
import { useChargenStore } from "@/features/chargen/stores/chargen";
import { useDataStore } from "@/stores/data";
import { ChargenGenerator } from "./ChargenGenerator";

const scanData = createChargenData({
  heads: {
    hm: ["hm_cps_enabled.mop"],
    hf: ["hf_cps_disabled.mop"],
  },
  hairs: {
    hf: ["hf_har_enabled_0"],
  },
});

describe("ChargenGenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAppStores();
  });

  it("scans, stores the backend snapshot, and generates from that snapshot", async () => {
    const { user } = renderWithUser(<ChargenGenerator />);
    const scanResult = createChargenScanResult({
      data: scanData,
      path: String.raw`\\?\D:\DAO\packages\core\override`,
    });

    vi.mocked(chargenApi.scanAssets).mockResolvedValue(scanResult);
    vi.mocked(chargenApi.generateFile).mockResolvedValue(undefined);
    useDataStore.getState().excludeResources("hf_cps_disabled.mop");

    await user.click(screen.getByRole("button", { name: "Scan" }));

    expect(chargenApi.scanAssets).toHaveBeenCalledWith(TEST_OVERRIDE_PATH);
    expect(await screen.findByLabelText("chargen summary")).toHaveTextContent(
      scanResult.path,
    );

    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(chargenApi.generateFile).toHaveBeenCalledWith(
      TEST_SCAN_ID,
      scanResult.path,
      ["hf_cps_disabled.mop"],
    );
  });

  it("discards the active frontend and backend scan snapshot", async () => {
    vi.mocked(chargenApi.clearScan).mockResolvedValue(undefined);
    setActiveChargenScan({ data: scanData });

    const { user } = renderWithUser(<ChargenGenerator />);

    await user.click(screen.getByRole("button", { name: "Discard Scan" }));

    expect(chargenApi.clearScan).toHaveBeenCalledWith(TEST_SCAN_ID);
    expect(useChargenStore.getState().scan).toBeNull();
    expect(screen.getByText("No chargen data loaded")).toBeInTheDocument();
  });

  it("requires confirmation before running override-folder cleanup", async () => {
    const { user } = renderWithUser(<ChargenGenerator />);

    vi.mocked(chargenApi.deleteFiles).mockResolvedValue(2);

    await user.click(screen.getByRole("button", { name: "Cleanup" }));
    expect(chargenApi.deleteFiles).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete XML Files" }));

    expect(chargenApi.deleteFiles).toHaveBeenCalledWith(TEST_OVERRIDE_PATH);
  });

  it("reports an empty scan without treating it as a failure", async () => {
    const { user } = renderWithUser(<ChargenGenerator />);
    const emptyScanResult = createChargenScanResult({
      id: "scan-empty",
    });

    vi.mocked(chargenApi.scanAssets).mockResolvedValue(emptyScanResult);

    await user.click(screen.getByRole("button", { name: "Scan" }));

    expect(toast.success).toHaveBeenCalledWith("Scan ready", {
      id: TEST_TOAST_ID,
      description: "No custom chargen files found in this override folder.",
    });
    expect(useChargenStore.getState().scan?.id).toBe("scan-empty");
  });

  it("reports a cleanup that found no generated files", async () => {
    const { user } = renderWithUser(<ChargenGenerator />);

    vi.mocked(chargenApi.deleteFiles).mockResolvedValue(0);

    await user.click(screen.getByRole("button", { name: "Cleanup" }));
    await user.click(screen.getByRole("button", { name: "Delete XML Files" }));

    expect(toast.success).toHaveBeenCalledWith(
      "No chargenmorphcfg.xml files found",
      {
        id: TEST_TOAST_ID,
        description: "Nothing was removed from this override folder.",
      },
    );
  });

  it("opens stale exclusion review for exclusions missing from the active scan", async () => {
    useDataStore.getState().excludeResources("resource_from_old_scan");
    setActiveChargenScan({ data: scanData });

    const { user } = renderWithUser(<ChargenGenerator />);

    await user.click(
      screen.getByRole("button", { name: /Review 1 Stale Exclusion/i }),
    );

    expect(screen.getByLabelText("stale exclusions dialog")).toHaveTextContent(
      "resource_from_old_scan",
    );
  });

  it("shows a scan failure toast without storing scan data", async () => {
    const { user } = renderWithUser(<ChargenGenerator />);

    vi.mocked(chargenApi.scanAssets).mockRejectedValue(
      new Error("permission denied"),
    );

    await user.click(screen.getByRole("button", { name: "Scan" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Scan could not read this folder",
      {
        id: TEST_TOAST_ID,
        description: "permission denied",
      },
    );
    expect(useChargenStore.getState().scan).toBeNull();
  });

  it("shows a generation failure toast while keeping the scan snapshot", async () => {
    vi.mocked(chargenApi.generateFile).mockRejectedValue(
      "disk is write-protected",
    );
    setActiveChargenScan({ data: scanData });

    const { user } = renderWithUser(<ChargenGenerator />);

    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Could not generate chargenmorphcfg.xml",
      {
        id: TEST_TOAST_ID,
        description: "disk is write-protected",
      },
    );
    expect(useChargenStore.getState().scan?.id).toBe(TEST_SCAN_ID);
  });

  it("shows a clear-scan failure toast without dropping the frontend snapshot", async () => {
    vi.mocked(chargenApi.clearScan).mockRejectedValue(
      new Error("stale scan id"),
    );
    setActiveChargenScan({ data: scanData });

    const { user } = renderWithUser(<ChargenGenerator />);

    await user.click(screen.getByRole("button", { name: "Discard Scan" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Could not clear the current scan",
      {
        description: "stale scan id",
      },
    );
    expect(useChargenStore.getState().scan?.id).toBe(TEST_SCAN_ID);
  });

  it("shows a cleanup failure toast after confirmation", async () => {
    const { user } = renderWithUser(<ChargenGenerator />);

    vi.mocked(chargenApi.deleteFiles).mockRejectedValue(
      new Error("folder is unreadable"),
    );

    await user.click(screen.getByRole("button", { name: "Cleanup" }));
    await user.click(screen.getByRole("button", { name: "Delete XML Files" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Could not delete chargenmorphcfg.xml files",
      {
        id: TEST_TOAST_ID,
        description: "folder is unreadable",
      },
    );
  });
});
