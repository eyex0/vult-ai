import type { CurrencyCode } from "./money.js";

/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Country {
  code: string;
  ar: string;
  en: string;
  currency: CurrencyCode;
  dial: string;
  weekend: Weekday[];
  /** National significant number length and allowed first digits for mobile numbers. */
  mobile: { length: number; starts: string[] };
}

// Weekends as of 2026: the UAE moved to Saturday–Sunday in 2022; most of the Gulf and Egypt rest Friday–Saturday.
export const COUNTRIES: Country[] = [
  { code: "SA", ar: "السعودية", en: "Saudi Arabia", currency: "SAR", dial: "966", weekend: [5, 6], mobile: { length: 9, starts: ["5"] } },
  { code: "AE", ar: "الإمارات", en: "United Arab Emirates", currency: "AED", dial: "971", weekend: [6, 0], mobile: { length: 9, starts: ["5"] } },
  { code: "EG", ar: "مصر", en: "Egypt", currency: "EGP", dial: "20", weekend: [5, 6], mobile: { length: 10, starts: ["1"] } },
  { code: "KW", ar: "الكويت", en: "Kuwait", currency: "KWD", dial: "965", weekend: [5, 6], mobile: { length: 8, starts: ["4", "5", "6", "9"] } },
  { code: "QA", ar: "قطر", en: "Qatar", currency: "QAR", dial: "974", weekend: [5, 6], mobile: { length: 8, starts: ["3", "5", "6", "7"] } },
  { code: "BH", ar: "البحرين", en: "Bahrain", currency: "BHD", dial: "973", weekend: [5, 6], mobile: { length: 8, starts: ["3", "6"] } },
  { code: "OM", ar: "عُمان", en: "Oman", currency: "OMR", dial: "968", weekend: [5, 6], mobile: { length: 8, starts: ["7", "9"] } },
  { code: "JO", ar: "الأردن", en: "Jordan", currency: "JOD", dial: "962", weekend: [5, 6], mobile: { length: 9, starts: ["7"] } },
  { code: "MA", ar: "المغرب", en: "Morocco", currency: "MAD", dial: "212", weekend: [6, 0], mobile: { length: 9, starts: ["6", "7"] } },
];

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}
