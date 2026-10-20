import { cn } from "@/lib/utils";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-border-strong px-1 font-sans text-[11px] text-fg-3",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
