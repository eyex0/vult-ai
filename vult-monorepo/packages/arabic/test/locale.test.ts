import { describe, expect, it } from "vitest";
import { addBusinessDays, formatDate, formatDualDate, formatMoney, fromMinor, isBusinessDay, normalizePhone, toMinor, validateTaxId, whatsappLink } from "../src/index.js";

describe("money", () => {
  it("uses each currency's decimals", () => {
    expect(formatMoney(1234.5, "KWD", { lang: "en" })).toContain("1,234.500");
    expect(formatMoney(1234.5, "SAR", { lang: "en" })).toContain("1,234.50");
    expect(formatMoney(1234.5, "SAR", { lang: "ar", digits: "arab" })).toContain("١٬٢٣٤٫٥٠");
  });
  it("converts minor units exactly", () => {
    expect(toMinor(12.345, "KWD")).toBe(12345);
    expect(fromMinor(12345, "BHD")).toBe(12.345);
    expect(toMinor(0.1 + 0.2, "SAR")).toBe(30);
  });
});

describe("dates", () => {
  const d = new Date(Date.UTC(2026, 2, 12));
  it("formats Hijri (Umm al-Qura) and dual dates", () => {
    expect(formatDate(d, { calendar: "islamic-umalqura", style: "long" })).toContain("1447");
    expect(formatDualDate(d, { lang: "ar" })).toMatch(/2026.*·.*1447/);
  });
  it("skips the local weekend", () => {
    const thu = new Date(Date.UTC(2026, 2, 12)); // Thursday
    expect(isBusinessDay(new Date(Date.UTC(2026, 2, 13)), "SA")).toBe(false); // Friday in Riyadh
    expect(isBusinessDay(new Date(Date.UTC(2026, 2, 13)), "AE")).toBe(true); // Friday in Dubai
    expect(addBusinessDays(thu, 1, "SA").getUTCDate()).toBe(15); // Thu + 1 → Sunday
    expect(addBusinessDays(thu, 1, "AE").getUTCDate()).toBe(13); // Thu + 1 → Friday
  });
});

describe("phone", () => {
  it.each([
    ["0501234567", "SA", "+966501234567"],
    ["00966 50 123 4567", "SA", "+966501234567"],
    ["٠٥٠١٢٣٤٥٦٧", "SA", "+966501234567"],
    ["+971 50 123 4567", "SA", "+971501234567"],
    ["01001234567", "EG", "+201001234567"],
    ["9999 1234", "KW", "+96599991234"],
  ])("%s (%s) → %s", (input, country, e164) => {
    const p = normalizePhone(input, country);
    expect(p?.e164).toBe(e164);
    expect(p?.mobile).toBe(true);
  });
  it("rejects garbage and builds WhatsApp links", () => {
    expect(normalizePhone("12", "SA")).toBeNull();
    expect(whatsappLink("+966501234567", "مرحبا")).toBe("https://wa.me/966501234567?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7");
  });
});

describe("tax ids", () => {
  it("checks the formats", () => {
    expect(validateTaxId("SA_VAT", "300000000000003").valid).toBe(true);
    expect(validateTaxId("SA_VAT", "٣٠٠٠٠٠٠٠٠٠٠٠٠٠٣").valid).toBe(true);
    expect(validateTaxId("SA_VAT", "300000000000004").valid).toBe(false);
    expect(validateTaxId("AE_TRN", "100-1234-5678-9012").valid).toBe(true);
    expect(validateTaxId("EG_TIN", "123-456-789").valid).toBe(true);
  });
});
