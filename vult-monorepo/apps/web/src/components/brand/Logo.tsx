import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function LogoMark({ tone = "dark", size = 26, className }: { tone?: "dark" | "light"; size?: number; className?: string }) {
  return (
    <img
      src={tone === "dark" ? "/brand/vult-logo-black.png" : "/brand/vult-logo-white.png"}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

/** Mark + lowercase "vult" wordmark. `tone="light"` is for dark backgrounds. */
export function Logo({ tone = "dark", href = "/", size = 26, className }: { tone?: "dark" | "light"; href?: string | null; size?: number; className?: string }) {
  const content = (
    <>
      <LogoMark tone={tone} size={size} />
      <span
        className={cn("font-bold leading-none tracking-[var(--tracking-tightest)]", tone === "dark" ? "text-ink" : "text-white")}
        style={{ fontSize: Math.round(size * 0.82) }}
      >
        vult
      </span>
    </>
  );
  const cls = cn("inline-flex items-center gap-[7px]", className);
  return href ? (
    <Link href={href} aria-label="Vult home" className={cls}>
      {content}
    </Link>
  ) : (
    <span className={cls}>{content}</span>
  );
}
