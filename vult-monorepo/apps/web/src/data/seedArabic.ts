import { countryByCode } from "@vult/arabic";
import { createSeed } from "./seed";
import type { DB, Industry, Member, Segment } from "./types";

/**
 * The same demo workspace for a company selling across the Gulf and Egypt: Arabic names, local
 * cities and currencies, phone numbers in each country's plan. All names and companies are fictional.
 */

const MEMBERS_AR: Pick<Member, "name" | "email" | "title">[] = [
  { name: "سارة القحطاني", email: "sara@nakhla.example", title: "مديرة المبيعات" },
  { name: "خالد العتيبي", email: "khalid@nakhla.example", title: "مدير حسابات" },
  { name: "ريم الحربي", email: "reem@nakhla.example", title: "مديرة حسابات" },
  { name: "يوسف منصور", email: "youssef@nakhla.example", title: "مهندس حلول" },
  { name: "نورة الدوسري", email: "noura@nakhla.example", title: "تطوير أعمال" },
  { name: "عمر فاروق", email: "omar@nakhla.example", title: "عمليات الإيرادات (متعاقد)" },
];

// name, industry, segment, city, country code
const COMPANIES_AR: [string, Industry, Segment, string, string][] = [
  ["مجموعة الواحة للتقنية", "Software", "Mid-market", "الرياض", "SA"],
  ["بيت التمويل الرقمي", "Fintech", "Enterprise", "دبي", "AE"],
  ["شركة الساحل للخدمات اللوجستية", "Logistics", "Enterprise", "جدة", "SA"],
  ["أسواق الريم", "Retail", "Mid-market", "القاهرة", "EG"],
  ["حلول نجد السحابية", "Software", "Enterprise", "الرياض", "SA"],
  ["منصة رواد", "Software", "SMB", "الخبر", "SA"],
  ["مستشفيات الشفاء الحديثة", "Healthcare", "Mid-market", "الدمام", "SA"],
  ["استوديو مدى للإنتاج", "Media", "SMB", "أبوظبي", "AE"],
  ["مصانع الجزيرة للمعادن", "Manufacturing", "Mid-market", "الجبيل", "SA"],
  ["أكاديمية المستقبل", "Education", "SMB", "الكويت", "KW"],
  ["نقل الخليج السريع", "Logistics", "Mid-market", "الدوحة", "QA"],
  ["مجموعة رعاية الصحية", "Healthcare", "Enterprise", "القاهرة", "EG"],
  ["مدفوعات أمان", "Fintech", "Mid-market", "الرياض", "SA"],
  ["بيانات الأفق للتحليلات", "Software", "SMB", "دبي", "AE"],
  ["مختبرات الحياة الطبية", "Healthcare", "Mid-market", "الإسكندرية", "EG"],
  ["سلسلة متاجر الياسمين", "Retail", "Enterprise", "جدة", "SA"],
  ["الشرق للصناعات الدقيقة", "Manufacturing", "Enterprise", "العاشر من رمضان", "EG"],
  ["قنوات الإعلام الجديد", "Media", "SMB", "الرياض", "SA"],
  ["سحابة الرمال", "Software", "Mid-market", "أبوظبي", "AE"],
  ["محفظة نقدي", "Fintech", "SMB", "القاهرة", "EG"],
  ["دار القلم للنشر", "Media", "SMB", "الشارقة", "AE"],
  ["أنظمة الصقر الآلية", "Manufacturing", "Mid-market", "الدمام", "SA"],
  ["مدارس النخبة الدولية", "Education", "Mid-market", "جدة", "SA"],
  ["شبكة تواصل", "Software", "Enterprise", "الرياض", "SA"],
  ["تجارة الأصيل", "Retail", "SMB", "مكة المكرمة", "SA"],
  ["حسابات بلس", "Fintech", "Mid-market", "دبي", "AE"],
  ["إمدادات البحر الأحمر", "Logistics", "SMB", "ينبع", "SA"],
  ["درع للأمن السيبراني", "Software", "Mid-market", "الرياض", "SA"],
  ["منصة تعلّم", "Education", "SMB", "عمّان", "JO"],
  ["أغذية الوادي", "Retail", "Enterprise", "القاهرة", "EG"],
];

const DOMAINS = [
  "alwaha", "digitalfinance", "sahel", "alreem", "najdcloud", "rowad", "alshifa", "mada", "jazeera", "future",
  "gulfexpress", "reaya", "aman", "ofoq", "hayat", "yasmeen", "sharq", "newmedia", "rimal", "naqdi",
  "qalam", "saqr", "nokhba", "tawasol", "aseel", "hesabat", "redsea", "dir3", "taallam", "alwadi",
];

const FIRST = ["محمد", "أحمد", "فاطمة", "عبدالله", "مريم", "خالد", "نورة", "يوسف", "سلمى", "عمر", "ليلى", "فيصل", "هند", "طارق", "دانة", "سعود", "رنا", "حسن", "لمى", "ماجد", "جميلة", "إبراهيم", "شهد", "وليد", "غادة", "تركي", "منى", "زياد", "أمل", "مصطفى"];
const FIRST_LATIN = ["mohamed", "ahmed", "fatma", "abdullah", "mariam", "khaled", "noura", "youssef", "salma", "omar", "laila", "faisal", "hind", "tarek", "dana", "saud", "rana", "hassan", "lama", "majed", "jamila", "ibrahim", "shahd", "walid", "ghada", "turki", "mona", "ziad", "amal", "mostafa"];
const LAST = ["الشهري", "الغامدي", "عبدالرحمن", "الزهراني", "السيد", "المطيري", "النجار", "الشمري", "حسين", "العنزي", "الكبيسي", "سليمان", "البلوشي", "إسماعيل", "الرشيد", "المالكي", "عثمان", "الفارس", "يونس", "العمري"];
const LAST_LATIN = ["alshehri", "alghamdi", "abdelrahman", "alzahrani", "elsayed", "almutairi", "elnaggar", "alshammari", "hussein", "alenazi", "alkubaisi", "soliman", "albalushi", "ismail", "alrasheed", "almalki", "osman", "alfares", "younes", "alomari"];

const TITLES = ["نائب رئيس المبيعات", "مدير العمليات", "المدير التقني", "مدير المشتريات", "المؤسس والرئيس التنفيذي", "المدير المالي", "مدير النمو", "مدير تقنية المعلومات", "مدير نجاح العملاء", "مدير المنتج"];

const DESCRIPTIONS: Record<Industry, string> = {
  Software: "تبني برمجيات لإدارة سير العمل للفرق الموزعة.",
  Fintech: "حلول مدفوعات وإدارة نقد للفرق المالية.",
  Healthcare: "منصة لتشغيل العيادات وتجربة المرضى.",
  Logistics: "تتبع الشحنات وإدارة المستودعات.",
  Retail: "تاجر تجزئة متعدد القنوات بنمو سريع في البيع الإلكتروني.",
  Media: "استوديو مستقل لإنتاج المحتوى للعلامات التجارية.",
  Manufacturing: "مكونات دقيقة للأتمتة الصناعية.",
  Education: "منصة تعليمية للمدارس والجامعات.",
};

const DEAL_NAMES = ["إطلاق المنصة", "تجديد سنوي", "التوسع في الخليج", "تجربة · 25 مستخدماً", "ربط مستودع البيانات", "إضافة الوكلاء الذكيين", "تعدد المناطق", "تسوية عدد المستخدمين", "توسيع فريق المبيعات", "باقة الإثراء", "بوابة الشركاء", "ترحيل سير العمل", "الترقية للمؤسسات", "تجربة فريق الدعم", "الإطلاق في مصر", "مراجعة أمنية", "إضافة التحليلات", "ترقية خطة الفريق", "توحيد المشتريات", "مساحة التسويق", "تفعيل نجاح العملاء", "تجديد لسنتين", "تجربة المبيعات الميدانية", "الوصول عبر API", "تقارير مجلس الإدارة"];

const NEXT_STEPS: Record<string, string> = {
  "Book discovery call": "حجز مكالمة استكشافية",
  "Send revised order form": "إرسال نموذج الطلب المعدّل",
  "Security questionnaire": "استبيان الأمان",
  "Technical deep-dive": "جلسة تقنية متعمقة",
  "Confirm seat count": "تأكيد عدد المستخدمين",
  "Legal review of DPA": "مراجعة قانونية لاتفاقية معالجة البيانات",
  "Pricing call": "مكالمة التسعير",
  "Champion intro to CFO": "تقديم الداعم للمدير المالي",
  "Kickoff scheduled": "تم تحديد موعد الانطلاق",
  "Share ROI model": "مشاركة نموذج العائد على الاستثمار",
  "Revisit next quarter": "إعادة التواصل الربع القادم",
};

const TASKS_AR = [
  "إرسال نموذج الطلب المعدّل", "تحضير ملاحظات مكالمة التسعير", "متابعة اتفاقية البيانات مع القانونية", "مكالمة تعارف مع مدير العمليات الجديد",
  "مشاركة ملف الأمان", "تحديث التوقعات لمراجعة الربع الرابع", "متابعة بعد الندوة", "صياغة خطة العمل المشتركة", "حجز جلسة تقنية متعمقة",
  "مراجعة نتائج الإثراء", "إرسال دراسة حالة للداعم", "تأكيد شروط التجديد", "تسجيل ملاحظات المراجعة الربعية", "تنظيف جهات الاتصال المكررة",
  "تحضير شريحة مجلس الإدارة", "تقديم مهندس الحلول للعميل", "معاودة الاتصال بالمشتريات", "إرسال قائمة التهيئة",
];

/** Rough rates from US dollars, so amounts look natural in each currency. */
const PER_USD: Record<string, number> = { SAR: 3.75, AED: 3.67, EGP: 48, KWD: 0.31, QAR: 3.64, JOD: 0.71 };

function localPhone(code: string, i: number): string {
  const n = String(1000000 + i * 7919).slice(-7);
  switch (code) {
    case "AE": return `05${(i % 9) + 0}${n}`.slice(0, 10);
    case "EG": return `010${n}${i % 10}`;
    case "KW": case "QA": return `5${n}`;
    case "JO": return `079${n}`;
    default: return `05${(i % 9) + 0}${n}`.slice(0, 10);
  }
}

export function createArabicSeed(now = Date.now()): DB {
  const db = createSeed(now);
  const countryOf = new Map<string, string>();

  db.workspace = { ...db.workspace, name: "النخلة للحلول", domain: "nakhla.example", currency: "SAR", country: "SA", calendar: "gregory" };
  db.members = db.members.map((m, i) => ({ ...m, ...MEMBERS_AR[i]! }));

  db.companies = db.companies.map((c, i) => {
    const [name, industry, segment, city, code] = COMPANIES_AR[i % COMPANIES_AR.length]!;
    const country = countryByCode(code)!;
    countryOf.set(c.id, code);
    return {
      ...c,
      name,
      industry,
      segment,
      city,
      country: country.ar,
      currency: country.currency,
      arr: Math.round((c.arr * (PER_USD[country.currency] ?? 1)) / 1000) * 1000,
      domain: `${DOMAINS[i % DOMAINS.length]}.example`,
      description: DESCRIPTIONS[industry],
    };
  });
  const companyById = new Map(db.companies.map((c) => [c.id, c]));

  db.people = db.people.map((p, i) => {
    const f = i % FIRST.length;
    const l = (i * 7 + Math.floor(i / FIRST.length) * 11) % LAST.length;
    const company = companyById.get(p.companyId)!;
    return {
      ...p,
      name: `${FIRST[f]} ${LAST[l]}`,
      email: `${FIRST_LATIN[f]}.${LAST_LATIN[l]}@${company.domain}`,
      title: TITLES[(i * 5) % TITLES.length]!,
      phone: localPhone(countryOf.get(p.companyId) ?? "SA", i),
      city: company.city,
    };
  });

  // Deals stay in the workspace currency (SAR) so pipeline totals add up.
  db.deals = db.deals.map((d, i) => ({
    ...d,
    name: DEAL_NAMES[i % DEAL_NAMES.length]!,
    value: Math.round((d.value * PER_USD.SAR!) / 500) * 500,
    nextStep: NEXT_STEPS[d.nextStep] ?? d.nextStep,
  }));

  db.tasks = db.tasks.map((t, i) => ({ ...t, title: TASKS_AR[i] ?? t.title }));
  return db;
}
