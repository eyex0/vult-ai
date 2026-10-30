/**
 * Arabic-aware text handling for search: the same name is written many ways (with or without
 * diacritics, hamza forms, taa marbuta) and is often typed in Latin letters with several spellings.
 */

const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

/** Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) digits to ASCII. */
export function toLatinDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10));
}

/** ASCII digits to Arabic-Indic digits, for display when a workspace prefers them. */
export function toArabicDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => String.fromCharCode(0x0660 + Number(d)));
}

/** True when the text contains Arabic letters. */
export function hasArabic(s: string): boolean {
  return /[؀-ۿݐ-ݿ]/.test(s);
}

/**
 * Folds the spelling differences that do not change meaning in a search: diacritics, tatweel,
 * hamza on alef, alef maqsura, taa marbuta, Persian letters, digits, case and spacing.
 */
export function normalizeArabic(s: string): string {
  return toLatinDigits(s)
    .normalize("NFKC")
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ک/g, "ك")
    .replace(/[یي]/g, "ي")
    .toLowerCase()
    .replace(/[\s‌‏‎]+/g, " ")
    .trim();
}

/** Splits into words, dropping the article (ال, al-, el-) so "الراجحي" and "Al Rajhi" line up. */
export function tokens(s: string): string[] {
  return normalizeArabic(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .flatMap((w) => {
      if (w === "al" || w === "el") return [];
      if (w.length > 3 && w.startsWith("ال")) return [w.slice(2)];
      return [w];
    });
}

// Arabic letters mapped to a coarse consonant class. Long vowels (ا و ي) and ع/ء carry no class:
// Latin spellings write them as vowels, which are dropped too.
const AR_KEY: Record<string, string> = {
  ب: "b", ت: "t", ط: "t", ث: "s", س: "s", ص: "s", ج: "j", ح: "h", ه: "h", خ: "k", ك: "k", ق: "k",
  د: "d", ض: "d", ذ: "z", ز: "z", ظ: "z", ر: "r", ش: "x", غ: "g", ف: "f", ل: "l", م: "m", ن: "n", و: "w", ي: "y",
};

function collapse(key: string): string {
  return key.replace(/(.)\1+/g, "$1");
}

function arabicKey(word: string): string {
  let out = "";
  [...word].forEach((ch, i) => {
    const k = AR_KEY[ch];
    if (!k) return;
    // و and ي are vowels inside a word (محمود, علي) and consonants only at its start (وليد, يوسف).
    if ((k === "w" || k === "y") && i > 0) return;
    out += k;
  });
  return collapse(out);
}

function latinKey(word: string): string {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  const first = w[0];
  w = w
    .replace(/kh/g, "k").replace(/gh/g, "G").replace(/sh/g, "x").replace(/ch/g, "x")
    .replace(/th/g, "s").replace(/dh/g, "z").replace(/ph/g, "f")
    .replace(/[qc]/g, "k").replace(/g/g, "j").replace(/G/g, "g");
  let out = "";
  [...w].forEach((ch, i) => {
    if ("aeiou".includes(ch)) return;
    if ((ch === "w" || ch === "y") && !(i === 0 && first === ch)) return;
    out += ch;
  });
  return collapse(out);
}

/**
 * A spelling-independent key for one word, the same for Arabic and Latin script:
 * محمد, Mohamed, Muhammad → "mhmd"; خالد, Khaled, Khalid → "kld".
 */
export function phoneticKey(word: string): string {
  const w = normalizeArabic(word);
  const key = hasArabic(w) ? arabicKey(w) : latinKey(w);
  // A final h is usually silent in both scripts (فاطمة / Fatma, عبدالله / Abdalla) except in short names (طه / Taha).
  return key.length > 2 && key.endsWith("h") ? key.slice(0, -1) : key;
}

/**
 * Does `text` match the search `query`? Every query word must match some word of the text,
 * either by its normalized prefix or by its phonetic key, so Arabic and Latin spellings find each other.
 */
export function matchesSearch(text: string, query: string): boolean {
  const q = tokens(query);
  if (!q.length) return true;
  const words = tokens(text);
  const keys = words.map(phoneticKey);
  return q.every((qw) => {
    if (words.some((w) => w.startsWith(qw))) return true;
    const k = phoneticKey(qw);
    return k.length >= 2 && keys.some((tk) => tk.startsWith(k));
  });
}
