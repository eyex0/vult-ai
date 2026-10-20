import type { LucideIcon } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export interface PageMeta {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  /** Optional crumb shown before the title, e.g. "Workflows". */
  parent?: { label: string; href: string };
}

const Ctx = createContext<{ meta: PageMeta; set: (m: PageMeta) => void }>({ meta: { title: "" }, set: () => {} });

export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, set] = useState<PageMeta>({ title: "" });
  return <Ctx.Provider value={{ meta, set }}>{children}</Ctx.Provider>;
}

export function usePageMetaValue() {
  return useContext(Ctx).meta;
}

/** Sets the top-bar title/icon and the document title for an app page. */
export function usePage(meta: PageMeta) {
  const { set } = useContext(Ctx);
  useDocumentTitle(meta.title);
  useEffect(() => {
    set(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.title, meta.icon, meta.iconColor, meta.parent?.label]);
}
