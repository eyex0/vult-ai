import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

/** Every color keeps white initials at ≥4.5:1 contrast. */
const palette = ["#3b5bfd", "#15803d", "#7048e8", "#c2410c", "#0b7285", "#c2255c", "#4263eb", "#237032", "#9a4f00", "#6741d9"];

export function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length]!;
}

export function Avatar({
  name,
  size = 20,
  square,
  className,
}: {
  name: string;
  size?: number;
  /** Square tiles are used for companies, round for people. */
  square?: boolean;
  className?: string;
}) {
  const text = square ? (name.trim()[0] ?? "?").toUpperCase() : initials(name);
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center font-bold text-white", square ? "rounded-[5px]" : "rounded-full", className)}
      style={{ width: size, height: size, background: colorFor(name), fontSize: Math.max(8, Math.round(size * 0.45)) }}
    >
      {text}
    </span>
  );
}
