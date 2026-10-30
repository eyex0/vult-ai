import { describe, expect, it } from "vitest";
import { matchesSearch, normalizeArabic, phoneticKey, toArabicDigits, toLatinDigits, tokens } from "../src/index.js";

describe("normalizeArabic", () => {
  it("folds diacritics, hamza, alef maqsura, taa marbuta and tatweel", () => {
    expect(normalizeArabic("مُحَمَّد")).toBe("محمد");
    expect(normalizeArabic("أحمد")).toBe(normalizeArabic("احمد"));
    expect(normalizeArabic("مصطفى")).toBe("مصطفي");
    expect(normalizeArabic("فاطمة")).toBe("فاطمه");
    expect(normalizeArabic("شـــركة")).toBe("شركه");
  });
  it("converts digits both ways", () => {
    expect(toLatinDigits("٠٥٠١٢٣٤٥٦٧ و ۴۲")).toBe("0501234567 و 42");
    expect(toArabicDigits("2026")).toBe("٢٠٢٦");
  });
  it("drops the article", () => {
    expect(tokens("شركة الراجحي")).toEqual(["شركه", "راجحي"]);
    expect(tokens("Al-Rajhi Group")).toEqual(["rajhi", "group"]);
  });
});

describe("phoneticKey", () => {
  it.each([
    ["محمد", ["Mohamed", "Muhammad", "Mohammed", "Mohammad"]],
    ["خالد", ["Khaled", "Khalid"]],
    ["أحمد", ["Ahmed", "Ahmad"]],
    ["يوسف", ["Youssef", "Yousef", "Yusuf"]],
    ["عبدالله", ["Abdallah", "Abdullah"]],
    ["محمود", ["Mahmoud", "Mahmood"]],
    ["فاطمة", ["Fatma", "Fatima"]],
    ["وليد", ["Walid", "Waleed"]],
    ["غادة", ["Ghada"]],
    ["جمال", ["Gamal", "Jamal"]],
    ["الراجحي", ["Rajhi"]],
    ["طه", ["Taha"]],
  ])("%s matches its Latin spellings", (ar, latin) => {
    const key = phoneticKey(tokens(ar)[0]!);
    for (const l of latin) expect(phoneticKey(l), l).toBe(key);
  });
});

describe("matchesSearch", () => {
  it("finds Arabic names from Latin queries and back", () => {
    expect(matchesSearch("محمد عبدالله الشهري", "mohamed shehri")).toBe(true);
    expect(matchesSearch("Khalid Al-Otaibi", "خالد العتيبي")).toBe(true);
    expect(matchesSearch("شركة المراعي", "مراعي")).toBe(true);
  });
  it("matches prefixes as the user types", () => {
    expect(matchesSearch("مؤسسة النخبة للتجارة", "النخ")).toBe(true);
    expect(matchesSearch("Acme Trading", "acm")).toBe(true);
  });
  it("does not match unrelated names", () => {
    expect(matchesSearch("محمد الشهري", "fatma")).toBe(false);
    expect(matchesSearch("Acme Trading", "zeta")).toBe(false);
  });
});
