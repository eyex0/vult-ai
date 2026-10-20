import * as T from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { useThemeClass } from "./ThemeScope";

export const TooltipProvider = T.Provider;

export function Tooltip({ label, children, side = "right" }: { label: ReactNode; children: ReactNode; side?: "top" | "right" | "bottom" | "left" }) {
  const theme = useThemeClass();
  return (
    <T.Root delayDuration={250}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <div className={theme}>
          <T.Content
            side={side}
            sideOffset={8}
            className="z-[99] animate-pop rounded-md bg-[#0b0c0d] px-2 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10"
          >
            {label}
          </T.Content>
        </div>
      </T.Portal>
    </T.Root>
  );
}
