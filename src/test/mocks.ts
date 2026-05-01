import React, { type ReactNode } from "react";
import { vi } from "vitest";

const MOTION_PROP_NAMES = new Set([
  "animate",
  "custom",
  "drag",
  "dragConstraints",
  "dragControls",
  "dragDirectionLock",
  "dragElastic",
  "dragListener",
  "dragMomentum",
  "dragPropagation",
  "dragSnapToOrigin",
  "dragTransition",
  "exit",
  "initial",
  "layout",
  "layoutDependency",
  "layoutId",
  "layoutRoot",
  "onUpdate",
  "styleEffect",
  "transformTemplate",
  "transition",
  "variants",
  "viewport",
  "whileDrag",
  "whileFocus",
  "whileHover",
  "whileInView",
  "whileTap",
]);

interface MotionComponentProps {
  children?: ReactNode;
  [key: string]: unknown;
}

function omitMotionProps(props: MotionComponentProps) {
  const elementProps = { ...props };
  const children = elementProps.children;

  delete elementProps.children;

  for (const key of Object.keys(elementProps)) {
    if (
      MOTION_PROP_NAMES.has(key) ||
      key.startsWith("while") ||
      key.startsWith("onViewport")
    ) {
      delete elementProps[key];
    }
  }

  return { children, elementProps };
}

function createMotionProxy() {
  const cache = new Map<string, (props: MotionComponentProps) => ReactNode>();

  return new Proxy(
    {},
    {
      get: (_, tag) => {
        if (typeof tag !== "string") return undefined;

        const cached = cache.get(tag);
        if (cached) return cached;

        const component = (props: MotionComponentProps) => {
          const { children, elementProps } = omitMotionProps(props);
          return React.createElement(tag, elementProps, children);
        };

        cache.set(tag, component);
        return component;
      },
    },
  );
}

export function createMotionReactMock(actual: object) {
  const motion = createMotionProxy();

  return {
    ...actual,
    AnimatePresence: ({ children }: { children?: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    MotionConfig: ({ children }: { children?: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    m: motion,
    motion,
  };
}

export function createSonnerMock() {
  return {
    Toaster: () => null,
    toast: {
      error: vi.fn(),
      loading: vi.fn(() => "toast-id"),
      success: vi.fn(),
    },
  };
}

export function createTanStackVirtualMock() {
  return {
    useVirtualizer: ({
      count,
      estimateSize,
      getItemKey,
    }: {
      count: number;
      estimateSize: () => number;
      getItemKey?: (index: number) => string | number;
    }) => ({
      getTotalSize: () => count * estimateSize(),
      getVirtualItems: () =>
        Array.from({ length: count }, (_, index) => ({
          index,
          key: getItemKey?.(index) ?? index,
          size: estimateSize(),
          start: index * estimateSize(),
        })),
      isScrolling: false,
    }),
  };
}

export function createTauriStoreMock() {
  return {
    createTauriStore: vi.fn(() => ({
      load: vi.fn(),
      save: vi.fn(),
      saveNow: vi.fn(),
      start: vi.fn(),
    })),
  };
}

export function createTauriCoreMock() {
  return {
    invoke: vi.fn(),
  };
}

export function createTauriPathMock() {
  return {
    documentDir: vi.fn(async () => "C:/Users/Test/Documents"),
    join: vi.fn(async (...segments: string[]) =>
      segments
        .filter(Boolean)
        .join("/")
        .replace(/[\\/]+/g, "/"),
    ),
  };
}

export function createTauriAppMock() {
  return {
    setTheme: vi.fn(async () => undefined),
  };
}

const currentWindowMock = {
  show: vi.fn(async () => undefined),
  theme: vi.fn(async () => "light"),
};

export function createTauriWindowMock() {
  return {
    getCurrentWindow: vi.fn(() => currentWindowMock),
  };
}

export function createTauriDialogMock() {
  return {
    open: vi.fn(async () => null),
  };
}

export function createTauriOpenerMock() {
  return {
    revealItemInDir: vi.fn(async () => undefined),
  };
}
