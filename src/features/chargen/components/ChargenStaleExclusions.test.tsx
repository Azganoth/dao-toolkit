import { describe, expect, it, vi } from "vitest";

import { render, renderWithUser, screen } from "@/test/utils/react";

import { ChargenStaleExclusions } from "./ChargenStaleExclusions";

describe("ChargenStaleExclusions", () => {
  it("renders stale exclusions and removes individual saved entries", async () => {
    const onRemove = vi.fn();

    const { user } = renderWithUser(
      <ChargenStaleExclusions
        open
        names={["old_head", "old_hair"]}
        onClearAll={vi.fn()}
        onOpenChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText("old_head")).toHaveClass("line-through");
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("stale exclusions")).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Remove saved exclusion" })[0],
    );

    expect(onRemove).toHaveBeenCalledWith("old_head");
  });

  it("clears all stale exclusions when entries exist", async () => {
    const onClearAll = vi.fn();

    const { user } = renderWithUser(
      <ChargenStaleExclusions
        open
        names={["old_head"]}
        onClearAll={onClearAll}
        onOpenChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Clear All Stale Exclusions" }),
    );

    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it("shows an empty state and disables clearing when there are no stale exclusions", () => {
    render(
      <ChargenStaleExclusions
        open
        names={[]}
        onClearAll={vi.fn()}
        onOpenChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No stale exclusions for this scan."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear All Stale Exclusions" }),
    ).toBeDisabled();
  });
});
