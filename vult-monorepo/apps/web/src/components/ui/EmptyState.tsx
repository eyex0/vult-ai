import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="dot-grid-dark mb-5 flex h-28 w-52 items-center justify-center [mask-image:radial-gradient(closest-side,#000_60%,transparent)]">
        <span className="flex size-14 items-center justify-center rounded-2xl border border-border-strong bg-surface-2 text-fg-3">
          <Icon className="size-6" strokeWidth={1.6} />
        </span>
      </div>
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-fg">{title}</h2>
      {children && <p className="mt-1.5 max-w-sm text-sm text-fg-3">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
