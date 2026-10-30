import { useEffect, useSyncExternalStore } from "react";
import { readJSON, writeJSON } from "./storage";
import { AR } from "./i18n.ar";

export type Locale = "en" | "ar";

const KEY = "locale";
const listeners = new Set<() => void>();

function initial(): Locale {
  const saved = readJSON<Locale | null>(KEY, null);
  if (saved === "en" || saved === "ar") return saved;
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ar") ? "ar" : "en";
}

let current: Locale = initial();

export function getLocale(): Locale {
  return current;
}

export function setLocale(next: Locale) {
  if (next === current) return;
  current = next;
  writeJSON(KEY, next);
  listeners.forEach((l) => l());
}

export function useLocale(): Locale {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}

export const isRtl = (l: Locale) => l === "ar";

/**
 * The English text is the key: t("Companies") is "الشركات" in Arabic, and any string without a
 * translation falls back to English instead of breaking. {name}-style placeholders are filled from vars.
 */
export function translate(locale: Locale, text: string, vars?: Record<string, string | number>): string {
  let out = locale === "ar" ? (AR[text] ?? text) : text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}

export function useT() {
  const locale = useLocale();
  return (text: string, vars?: Record<string, string | number>) => translate(locale, text, vars);
}

/** Sets <html lang dir> while the workspace is mounted, so portals (menus, dialogs) follow the direction too. */
export function useDocumentDirection() {
  const locale = useLocale();
  useEffect(() => {
    const el = document.documentElement;
    const prev = { lang: el.lang, dir: el.dir };
    el.lang = locale;
    el.dir = isRtl(locale) ? "rtl" : "ltr";
    return () => {
      el.lang = prev.lang;
      el.dir = prev.dir;
    };
  }, [locale]);
}

export type LogicalSide = "top" | "bottom" | "start" | "end";

/** Popover libraries position physically; map a logical side to left/right for the current direction. */
export function physicalSide(side: LogicalSide, locale: Locale): "top" | "bottom" | "left" | "right" {
  if (side === "top" || side === "bottom") return side;
  const rtl = isRtl(locale);
  return (side === "start") !== rtl ? "left" : "right";
}

/**
 * Non-hook translation for labels built outside components (column definitions, constants).
 * The workspace remounts when the language changes, so these are re-read on every switch.
 */
export function tr(text: string, vars?: Record<string, string | number>): string {
  return translate(current, text, vars);
}
