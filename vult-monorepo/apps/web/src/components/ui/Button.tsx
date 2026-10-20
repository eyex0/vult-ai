import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "inverse" | "outline-inverse" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "group/btn relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-[550] " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-hover shadow-[0_1px_2px_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.12)]",
  secondary: "border border-border-strong bg-surface text-fg hover:bg-surface-hover shadow-[0_1px_2px_rgb(16_17_26/0.05)]",
  ghost: "text-fg-2 hover:bg-surface-hover hover:text-fg",
  accent: "bg-accent text-white hover:bg-accent-ink shadow-[0_1px_2px_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.15)]",
  inverse: "bg-white text-ink hover:bg-[#e9eaee]",
  "outline-inverse": "border border-[#34363c] text-white hover:bg-white/5",
  danger: "border border-danger/30 text-danger hover:bg-danger/10 [.theme-dark_&]:border-[#5a2a2a] [.theme-dark_&]:text-[#f59090]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 rounded-[7px] px-3 text-[13px]",
  md: "h-9 rounded-btn px-3.5 text-sm",
  lg: "h-11 rounded-btn px-[18px] text-[15px]",
  icon: "size-9 rounded-btn",
  "icon-sm": "size-8 rounded-[7px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Renders a trailing arrow that nudges right on hover. */
  arrow?: boolean;
  href?: string;
  children?: ReactNode;
}

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

function Arrow() {
  return (
    <ArrowRight
      aria-hidden
      className="size-[15px] transition-transform duration-150 group-hover/btn:translate-x-[3px]"
      strokeWidth={2}
    />
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", arrow, href, className, children, type = "button", ...rest },
  ref,
) {
  const cls = buttonClass(variant, size, className);
  if (href) {
    const external = /^(https?:|mailto:)/.test(href);
    const content = (
      <>
        {children}
        {arrow && <Arrow />}
      </>
    );
    return external ? (
      <a href={href} className={cls} aria-label={rest["aria-label"]}>
        {content}
      </a>
    ) : (
      <Link href={href} className={cls} aria-label={rest["aria-label"]}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} className={cls} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
});
