import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { useThemeClass } from "./ThemeScope";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  align = "center",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  align?: "center" | "top";
}) {
  const theme = useThemeClass();
  const width = size === "sm" ? "max-w-[420px]" : size === "lg" ? "max-w-[720px]" : "max-w-[520px]";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <div className={theme}>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-[90] bg-overlay backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                />
              </Dialog.Overlay>
              <div
                className={cn(
                  "pointer-events-none fixed inset-0 z-[91] flex justify-center p-4",
                  align === "top" ? "items-start pt-[12vh]" : "items-center",
                )}
              >
                <Dialog.Content asChild forceMount aria-describedby={description ? undefined : undefined}>
                  <motion.div
                    className={cn(
                      "pointer-events-auto flex max-h-[calc(100vh-32px)] w-full flex-col overflow-hidden rounded-card border border-border-strong bg-pop text-fg shadow-pop",
                      theme && "shadow-dark-pop",
                      width,
                    )}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: spring }}
                    exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.14 } }}
                  >
                    <div className="flex items-start gap-3 border-b border-border px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <Dialog.Title className="text-[15px] font-semibold tracking-[-0.01em]">{title}</Dialog.Title>
                        {description ? (
                          <Dialog.Description className="mt-0.5 text-[13px] text-fg-3">{description}</Dialog.Description>
                        ) : (
                          <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</Dialog.Description>
                        )}
                      </div>
                      <Dialog.Close
                        aria-label="Close"
                        className="-mr-1.5 -mt-1 inline-flex size-8 items-center justify-center rounded-[7px] text-fg-3 transition-colors hover:bg-surface-hover hover:text-fg"
                      >
                        <X className="size-4" />
                      </Dialog.Close>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
                    {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3.5">{footer}</div>}
                  </motion.div>
                </Dialog.Content>
              </div>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
