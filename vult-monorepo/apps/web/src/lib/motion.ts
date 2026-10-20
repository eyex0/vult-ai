import type { Transition, Variants } from "framer-motion";

export const spring: Transition = { type: "spring", stiffness: 380, damping: 30, mass: 0.8 };
export const softSpring: Transition = { type: "spring", stiffness: 220, damping: 26 };
export const easeOut: Transition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export const stagger = (step = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});

export const pop: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

/** Props for a section that reveals once when scrolled into view. */
export const inView = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-80px" },
} as const;
