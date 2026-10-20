import * as RT from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export interface TabItem {
  value: string;
  label: ReactNode;
  count?: number;
}

/** Underline tabs with an animated indicator. Content goes in <TabPanel>. */
export function Tabs({
  value,
  onValueChange,
  items,
  children,
  className,
  listClassName,
  variant = "underline",
}: {
  value: string;
  onValueChange: (v: string) => void;
  items: TabItem[];
  children?: ReactNode;
  className?: string;
  listClassName?: string;
  variant?: "underline" | "pill";
}) {
  const id = useId();
  if (!children) {
    // Used as a filter/segmented control: no panels, so plain toggle buttons (aria-pressed) instead of ARIA tabs.
    return (
      <div role="group" className={cn("flex w-fit items-center gap-1 overflow-x-auto", variant === "pill" && "rounded-[9px] border border-border bg-surface-2 p-0.5", variant === "underline" && "border-b border-border", className, listClassName)}>
        {items.map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              type="button"
              aria-pressed={active}
              onClick={() => onValueChange(t.value)}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13.5px] font-[550] outline-none transition-colors",
                variant === "underline" ? "h-10 px-2.5" : "h-7 rounded-[7px] px-3",
                active ? "text-fg" : "text-fg-3 hover:text-fg",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`${id}-indicator`}
                  transition={spring}
                  className={cn("absolute", variant === "underline" ? "inset-x-1.5 -bottom-px h-0.5 rounded-full bg-accent" : "inset-0 rounded-[7px] bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_1px_var(--border)]")}
                />
              )}
              <span className="relative">{t.label}</span>
              {t.count != null && <span className="relative text-xs font-normal text-fg-3">{t.count}</span>}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <RT.Root value={value} onValueChange={onValueChange} className={className}>
      <RT.List
        className={cn(
          "flex items-center gap-1 overflow-x-auto",
          variant === "underline" ? "border-b border-border" : "w-fit rounded-[9px] border border-border bg-surface-2 p-0.5",
          listClassName,
        )}
      >
        {items.map((t) => {
          const active = t.value === value;
          return (
            <RT.Trigger
              key={t.value}
              value={t.value}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13.5px] font-[550] outline-none transition-colors",
                variant === "underline" ? "h-10 px-2.5" : "h-7 rounded-[7px] px-3",
                active ? "text-fg" : "text-fg-3 hover:text-fg",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`${id}-indicator`}
                  transition={spring}
                  className={cn(
                    "absolute",
                    variant === "underline"
                      ? "inset-x-1.5 -bottom-px h-0.5 rounded-full bg-accent"
                      : "inset-0 rounded-[7px] bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_1px_var(--border)]",
                  )}
                />
              )}
              <span className="relative">{t.label}</span>
              {t.count != null && <span className="relative text-xs font-normal text-fg-3">{t.count}</span>}
            </RT.Trigger>
          );
        })}
      </RT.List>
      {children}
    </RT.Root>
  );
}

export const TabPanel = ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => (
  <RT.Content value={value} className={cn("outline-none", className)}>
    {children}
  </RT.Content>
);
