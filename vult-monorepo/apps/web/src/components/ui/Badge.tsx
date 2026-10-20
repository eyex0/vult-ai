import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "blue" | "violet" | "amber" | "green" | "red" | "teal" | "pink";

/** Tones read on both light and dark surfaces (tinted background, saturated text). */
const tones: Record<BadgeTone, { light: string; dark: string; dot: string }> = {
  neutral: { light: "bg-[#eef0f3] text-[#4b4f5c]", dark: "bg-[rgb(138_141_150/0.16)] text-[#b7bac3]", dot: "#8a8d96" },
  blue: { light: "bg-accent-soft text-accent-ink", dark: "bg-[rgb(59_91_253/0.2)] text-[#9daeff]", dot: "#6f87ff" },
  violet: { light: "bg-[#efe8ff] text-[#5b3cc4]", dark: "bg-[rgb(155_108_255/0.18)] text-[#c2a6ff]", dot: "#9b6cff" },
  amber: { light: "bg-warning-soft text-warning", dark: "bg-[rgb(242_153_74/0.18)] text-[#f6b67a]", dot: "#f2994a" },
  green: { light: "bg-success-soft text-success", dark: "bg-[rgb(61_220_132/0.16)] text-[#6fe3a5]", dot: "#3ddc84" },
  red: { light: "bg-danger-soft text-danger", dark: "bg-[rgb(240_82_82/0.16)] text-[#f59090]", dot: "#f05252" },
  teal: { light: "bg-[#e0f4f6] text-[#0b6672]", dark: "bg-[rgb(21_170_191/0.16)] text-[#7fd6e2]", dot: "#15aabf" },
  pink: { light: "bg-[#fde8f1] text-[#a61e5a]", dark: "bg-[rgb(230_73_128/0.16)] text-[#f39cc0]", dot: "#e64980" },
};

export function badgeDot(tone: BadgeTone) {
  return tones[tone].dot;
}

export function Badge({
  tone = "neutral",
  dark,
  dot,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dark?: boolean; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-[550]",
        dark ? tones[tone].dark : tones[tone].light,
        className,
      )}
      {...rest}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Small blue "label" pill used above section headlines on the marketing site. */
export function Eyebrow({ children, dark, className }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-[7px] text-[13.5px] font-medium",
        dark ? "bg-[rgb(59_91_253/0.22)] text-[#b4c2ff]" : "bg-accent-soft text-accent-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
