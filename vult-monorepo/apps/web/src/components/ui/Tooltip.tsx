import * as T from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { physicalSide, useLocale, type LogicalSide } from "@/lib/i18n";
import { useThemeClass } from "./ThemeScope";

export const TooltipProvider = T.Provider;

export function Tooltip({ label, children, side = "end" }: { label: ReactNode; children: ReactNode; side?: LogicalSide }) {
  const theme = useThemeClass();
  const locale = useLocale();
  return (
    <T.Root delayDuration={250}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <div className={theme}>
          <T.Content
            side={physicalSide(side, locale)}
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
