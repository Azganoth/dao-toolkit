import { describe, expect, it } from "vitest";

import { getErrorMessage } from "./errors";

describe("getErrorMessage", () => {
  it("returns Error messages unchanged", () => {
    expect(getErrorMessage(new Error("Failed to scan override folder"))).toBe(
      "Failed to scan override folder",
    );
  });

  it("returns string errors unchanged", () => {
    expect(getErrorMessage("Generation failed")).toBe("Generation failed");
  });

  it("falls back for unknown error shapes", () => {
    expect(getErrorMessage(null)).toBe("An unknown error occurred.");
    expect(getErrorMessage({ message: "not trusted" })).toBe(
      "An unknown error occurred.",
    );
  });
});
