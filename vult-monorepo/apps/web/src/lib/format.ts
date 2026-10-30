import { getDB } from "@/data/store";
import { getLocale } from "./i18n";

/** Locale tag with Latin digits, the convention in business software across the Gulf and Egypt. */
const tag = () => `${getLocale() === "ar" ? "ar" : "en-US"}-u-nu-latn`;
const workspaceCurrency = () => getDB().workspace.currency ?? "USD";
const calendar = () => getDB().workspace.calendar ?? "gregory";

export const formatMoney = (n: number, currency = workspaceCurrency()) =>
  new Intl.NumberFormat(tag(), { style: "currency", currency, maximumFractionDigits: 0 }).format(n || 0);
export const formatCompactMoney = (n: number, currency = workspaceCurrency()) =>
  new Intl.NumberFormat(tag(), { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(n || 0);
export const formatNumber = (n: number) => new Intl.NumberFormat(tag()).format(n || 0);

export function formatDate(iso: string | undefined, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(`${tag().replace("-u-", `-u-ca-${calendar()}-`)}`, opts).format(d);
}

const rel = () => new Intl.RelativeTimeFormat(tag(), { numeric: "auto" });

export function relativeDay(iso: string | undefined): string {
  if (!iso) return getLocale() === "ar" ? "بدون تاريخ" : "No date";
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (Math.abs(diff) <= 1) {
    const s = rel().format(diff, "day");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return formatDate(iso);
}

export function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return getLocale() === "ar" ? "الآن" : "just now";
  const m = Math.round(s / 60);
  if (getLocale() === "ar") {
    if (m < 60) return rel().format(-m, "minute");
    const h = Math.round(m / 60);
    if (h < 24) return rel().format(-h, "hour");
    const d = Math.round(h / 24);
    return d < 30 ? rel().format(-d, "day") : formatDate(iso);
  }
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : formatDate(iso);
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join(getLocale() === "ar" ? "‌" : "");

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (getLocale() === "ar") return h < 12 ? "صباح الخير" : "مساء الخير";
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
