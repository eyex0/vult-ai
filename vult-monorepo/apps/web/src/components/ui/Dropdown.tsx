import * as DM from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useThemeClass } from "./ThemeScope";

export const DropdownRoot = DM.Root;
export const DropdownTrigger = DM.Trigger;

export function DropdownContent({
  children,
  align = "start",
  className,
  sideOffset = 6,
}: {
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  sideOffset?: number;
}) {
  const theme = useThemeClass();
  return (
    <DM.Portal>
      <div className={theme}>
        <DM.Content
          align={align}
          sideOffset={sideOffset}
          collisionPadding={12}
          className={cn(
            "z-[95] min-w-[200px] animate-pop rounded-xl border border-border-strong bg-pop p-1 text-[13.5px] text-fg shadow-pop",
            theme && "shadow-dark-pop",
            className,
          )}
        >
          {children}
        </DM.Content>
      </div>
    </DM.Portal>
  );
}

const itemCls =
  "relative flex h-8 cursor-pointer select-none items-center gap-2 rounded-[7px] px-2 text-fg outline-none transition-colors " +
  "data-[highlighted]:bg-surface-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-[15px] [&_svg]:text-fg-3";

export function DropdownItem({
  children,
  onSelect,
  danger,
  shortcut,
}: {
  children: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  shortcut?: string;
}) {
  return (
    <DM.Item onSelect={onSelect} className={cn(itemCls, danger && "text-danger [&_svg]:text-danger")}>
      {children}
      {shortcut && <span className="ml-auto pl-4 text-xs text-fg-3">{shortcut}</span>}
    </DM.Item>
  );
}

export function DropdownCheckItem({
  children,
  checked,
  onCheckedChange,
}: {
  children: ReactNode;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <DM.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(e) => e.preventDefault()}
      className={cn(itemCls, "pl-7")}
    >
      <DM.ItemIndicator className="absolute left-2 inline-flex">
        <Check className="!text-fg" />
      </DM.ItemIndicator>
      {children}
    </DM.CheckboxItem>
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <DM.Label className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-3">{children}</DM.Label>;
}

export function DropdownSeparator() {
  return <DM.Separator className="-mx-1 my-1 h-px bg-border" />;
}
