import {
  act,
  cleanup,
  renderHook as renderHookWithTestingLibrary,
  render as renderWithTestingLibrary,
  screen,
  type RenderHookOptions,
  type RenderOptions,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { afterEach } from "vitest";

import { TooltipProvider } from "@/components/ui/Tooltip";

afterEach(() => {
  cleanup();
});

function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return renderWithTestingLibrary(ui, {
    wrapper: Providers,
    ...options,
  });
}

function renderHook<Result, Props>(
  render: (initialProps: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, "wrapper">,
) {
  return renderHookWithTestingLibrary(render, {
    wrapper: Providers,
    ...options,
  });
}

export { act, render, renderHook, screen };
