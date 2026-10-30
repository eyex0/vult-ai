/** Currencies of the Arab world, with their minor units: Kuwait, Bahrain, Oman, Jordan, Tunisia, Libya and Iraq use 3 decimals. */
export const CURRENCIES = {
  SAR: { decimals: 2, ar: "ريال سعودي", en: "Saudi riyal" },
  AED: { decimals: 2, ar: "درهم إماراتي", en: "UAE dirham" },
  KWD: { decimals: 3, ar: "دينار كويتي", en: "Kuwaiti dinar" },
  QAR: { decimals: 2, ar: "ريال قطري", en: "Qatari riyal" },
  BHD: { decimals: 3, ar: "دينار بحريني", en: "Bahraini dinar" },
  OMR: { decimals: 3, ar: "ريال عماني", en: "Omani rial" },
  EGP: { decimals: 2, ar: "جنيه مصري", en: "Egyptian pound" },
  JOD: { decimals: 3, ar: "دينار أردني", en: "Jordanian dinar" },
  LBP: { decimals: 0, ar: "ليرة لبنانية", en: "Lebanese pound" },
  IQD: { decimals: 3, ar: "دينار عراقي", en: "Iraqi dinar" },
  MAD: { decimals: 2, ar: "درهم مغربي", en: "Moroccan dirham" },
  TND: { decimals: 3, ar: "دينار تونسي", en: "Tunisian dinar" },
  DZD: { decimals: 2, ar: "دينار جزائري", en: "Algerian dinar" },
  LYD: { decimals: 3, ar: "دينار ليبي", en: "Libyan dinar" },
  USD: { decimals: 2, ar: "دولار أمريكي", en: "US dollar" },
  EUR: { decimals: 2, ar: "يورو", en: "Euro" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export type Lang = "ar" | "en";
/** latn: 0-9 (the default in business software across the Gulf); arab: ٠-٩. */
export type Digits = "latn" | "arab";

export function isCurrency(code: string): code is CurrencyCode {
  return code in CURRENCIES;
}

/** Formats an amount with the currency's own number of decimals, in Arabic or English. */
export function formatMoney(amount: number, currency: CurrencyCode, opts: { lang?: Lang; digits?: Digits; compact?: boolean } = {}): string {
  const { lang = "ar", digits = "latn", compact = false } = opts;
  const decimals = CURRENCIES[currency].decimals;
  return new Intl.NumberFormat(`${lang}-u-nu-${digits}`, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: compact ? 1 : decimals,
  }).format(amount);
}

/** Integer minor units (fils, halalas, piastres) to a decimal amount, without floating-point drift in storage. */
export function fromMinor(minor: number, currency: CurrencyCode): number {
  return minor / 10 ** CURRENCIES[currency].decimals;
}

export function toMinor(amount: number, currency: CurrencyCode): number {
  return Math.round(amount * 10 ** CURRENCIES[currency].decimals);
}
