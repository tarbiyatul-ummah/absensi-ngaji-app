import { useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";

/**
 * SmoothUI Core Spring Defaults (smoothui-animation.md)
 * Designed for fast, snappy interactions (under 300ms) with GPU-accelerated transforms.
 */

// Natural spring for standard UI transitions
export const springDefault: Transition = {
  type: "spring",
  duration: 0.25,
  bounce: 0.1,
};

// Snappy spring for micro-interactions (hover, tap, buttons)
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 17,
};

// Smooth cubic bezier ease-out
export const easeOutSmooth: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};

/**
 * Standard Enter/Exit Variants
 */
export const fadeSlideUpVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springDefault,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

export const scaleFadeVariants: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springDefault,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

/**
 * Staggered Lists Container and Item Variants
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springDefault,
  },
};

/**
 * Accessibility hook respecting prefers-reduced-motion
 */
export function useSmoothMotion() {
  const shouldReduceMotion = useReducedMotion();

  return {
    shouldReduceMotion,
    // Transitions that gracefully collapse to minimal opacity fade when reduced motion is requested
    transition: shouldReduceMotion
      ? { duration: 0 }
      : springDefault,
    tapProps: shouldReduceMotion
      ? {}
      : {
          whileTap: { scale: 0.97 },
          transition: springSnappy,
        },
    cardHoverProps: shouldReduceMotion
      ? {}
      : {
          whileHover: { y: -2 },
          whileTap: { scale: 0.99 },
          transition: springSnappy,
        },
  };
}

