import { COUNTRIES, countryByCode } from "./countries.js";
import { toLatinDigits } from "./text.js";

export interface Phone {
  e164: string;
  country: string;
  mobile: boolean;
}

/**
 * Normalizes the ways people type phone numbers in the region (05x…, 00966…, +966 5x…, ٠٥٠…)
 * to E.164. Returns null when the number does not fit the country's plan.
 */
export function normalizePhone(input: string, defaultCountry = "SA"): Phone | null {
  let d = toLatinDigits(input).replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  let country = countryByCode(defaultCountry);
  let national: string;
  if (d.startsWith("+")) {
    const digits = d.slice(1);
    country = COUNTRIES.filter((c) => digits.startsWith(c.dial)).sort((a, b) => b.dial.length - a.dial.length)[0];
    if (!country) return /^\d{8,15}$/.test(digits) ? { e164: "+" + digits, country: "", mobile: false } : null;
    national = digits.slice(country.dial.length);
  } else {
    if (!country) return null;
    national = d;
  }
  national = national.replace(/^0+/, "");
  if (!/^\d+$/.test(national) || national.length < 7 || national.length > 11) return null;
  const mobile = national.length === country.mobile.length && country.mobile.starts.some((s) => national.startsWith(s));
  return { e164: `+${country.dial}${national}`, country: country.code, mobile };
}

/** A click-to-chat link; WhatsApp is the main business channel across the region. */
export function whatsappLink(e164: string, text?: string): string {
  const base = `https://wa.me/${e164.replace(/^\+/, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
