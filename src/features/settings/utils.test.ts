import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { TEST_OVERRIDE_PATH } from "@/test/utils/constants";
import { requireOverridePath } from "./utils";

describe("settings utils", () => {
  it("rejects missing override paths with a toast", () => {
    expect(requireOverridePath(null)).toBe(false);

    expect(toast.error).toHaveBeenCalledWith(
      "Choose an override folder first",
      {
        description: "Set the Dragon Age override directory in Settings.",
      },
    );
  });

  it("accepts selected override paths", () => {
    vi.mocked(toast.error).mockClear();

    expect(requireOverridePath(TEST_OVERRIDE_PATH)).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
