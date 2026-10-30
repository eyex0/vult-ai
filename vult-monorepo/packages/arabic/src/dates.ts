import { countryByCode, type Weekday } from "./countries.js";
import type { Digits, Lang } from "./money.js";

export type Calendar = "gregory" | "islamic-umalqura";

/** Formats a date in the Gregorian or the Umm al-Qura (Saudi official) Hijri calendar. */
export function formatDate(date: Date, opts: { lang?: Lang; calendar?: Calendar; digits?: Digits; style?: "short" | "medium" | "long" } = {}): string {
  const { lang = "ar", calendar = "gregory", digits = "latn", style = "medium" } = opts;
  return new Intl.DateTimeFormat(`${lang}-u-ca-${calendar}-nu-${digits}`, { dateStyle: style, timeZone: "UTC" }).format(date);
}

/** "12 مارس 2026 · 23 رمضان 1447 هـ": both calendars, as Saudi documents usually show them. */
export function formatDualDate(date: Date, opts: { lang?: Lang; digits?: Digits } = {}): string {
  return `${formatDate(date, { ...opts, style: "long" })} · ${formatDate(date, { ...opts, calendar: "islamic-umalqura", style: "long" })}`;
}

export function weekendOf(country: string): Weekday[] {
  return countryByCode(country)?.weekend ?? [6, 0];
}

export function isBusinessDay(date: Date, country: string): boolean {
  return !weekendOf(country).includes(date.getUTCDay() as Weekday);
}

/** Adds working days, skipping the country's weekend (due dates, follow-up reminders). */
export function addBusinessDays(date: Date, days: number, country: string): Date {
  const d = new Date(date.getTime());
  const step = days < 0 ? -1 : 1;
  let left = Math.abs(days);
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + step);
    if (isBusinessDay(d, country)) left--;
  }
  return d;
}
