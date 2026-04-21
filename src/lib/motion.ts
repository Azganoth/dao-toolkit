import { type Easing, type Transition } from "motion/react";

export const MOTION_DURATION = {
  instant: 0.1,
  fast: 0.24,
  normal: 0.38,
  slow: 0.5,
};

export const MOTION_EASE = {
  standard: [0.22, 1, 0.36, 1],
  emphasized: [0.16, 1, 0.3, 1],
} satisfies Record<string, Easing>;

export const MOTION_TRANSITION = {
  fast: {
    duration: MOTION_DURATION.fast,
    ease: MOTION_EASE.standard,
  },
  normal: {
    duration: MOTION_DURATION.normal,
    ease: MOTION_EASE.standard,
  },
  slow: {
    duration: MOTION_DURATION.slow,
    ease: MOTION_EASE.emphasized,
  },
  tap: {
    duration: MOTION_DURATION.instant,
    ease: MOTION_EASE.standard,
  },
} satisfies Record<string, Transition>;
