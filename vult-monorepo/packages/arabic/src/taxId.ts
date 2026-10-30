import { toLatinDigits } from "./text.js";

export type TaxIdKind = "SA_VAT" | "SA_CR" | "AE_TRN" | "EG_TIN";

export interface TaxIdResult {
  valid: boolean;
  kind: TaxIdKind;
  normalized: string;
  error?: string;
}

const RULES: Record<TaxIdKind, { re: RegExp; error: string }> = {
  // ZATCA VAT number: 15 digits, starting and ending with 3.
  SA_VAT: { re: /^3\d{13}3$/, error: "15 digits, starting and ending with 3" },
  // Commercial registration: 10 digits.
  SA_CR: { re: /^\d{10}$/, error: "10 digits" },
  // UAE Tax Registration Number: 15 digits, starting with 100.
  AE_TRN: { re: /^100\d{12}$/, error: "15 digits, starting with 100" },
  // Egyptian tax registration number: 9 digits.
  EG_TIN: { re: /^\d{9}$/, error: "9 digits" },
};

/** Checks the format of a company tax or registration number (format only, not the authority's register). */
export function validateTaxId(kind: TaxIdKind, input: string): TaxIdResult {
  const normalized = toLatinDigits(input).replace(/[\s-]/g, "");
  const rule = RULES[kind];
  return rule.re.test(normalized) ? { valid: true, kind, normalized } : { valid: false, kind, normalized, error: rule.error };
}
