import { motion, useReducedMotion } from "framer-motion";
import { Check, FileUp, Landmark, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { EarlyAccessForm } from "@/components/marketing/EarlyAccessForm";
import { FAQ, Reveal, RevealGroup, RevealItem, SectionIntro, TwoTone } from "@/components/marketing/Section";
import { Eyebrow } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const COPY = {
  en: {
    title: "Early access",
    eyebrow: "Early access · free 30-day pilot",
    lead: "Know who paid.",
    rest: "Get paid faster.",
    sub: "Send us your e-invoices and a bank statement. In one working day you see every payment matched to its invoice, who still owes you, and how much time your team gets back.",
    cta: "Request early access",
    secondary: "How it works",
    problemEyebrow: "The problem",
    problemLead: "Your money is in someone else's account.",
    problemRest: "And finding out who paid takes your team days every month.",
    stats: [
      ["50–73 days", "average time Italian companies take to pay their suppliers (Cerved, 2025)"],
      ["~1 in 4", "B2B invoices paid late (Atradius, 2026)"],
      ["Hours", "every month matching bank lines to invoices in spreadsheets"],
    ],
    stepsEyebrow: "How the pilot works",
    stepsLead: "Three steps, one working day.",
    steps: [
      [FileUp, "Send your files", "The ZIP of invoices from the Agenzia delle Entrate portal and a bank statement (camt.053 or CSV). No bank connection needed."],
      [Sparkles, "Vult matches everything", "Every transfer matched to its invoices, including several invoices in one payment, credit notes, fees and Ri.Ba."],
      [Landmark, "You see your cash", "Who paid, who owes you, how late each customer pays, and what to chase first."],
    ],
    getEyebrow: "What you get",
    get: [
      "A workspace set up for you, with your real data",
      "Every payment matched; you confirm the few the engine is unsure about",
      "Balance, overdue amount and payment habits for every customer",
      "A report at the end of the 30 days: hours saved and invoices collected",
      "Direct line to the team building Vult",
    ],
    formTitle: "Request your pilot.",
    formSub: "We take ten companies this month. No card, no commitment.",
    faq: [
      { q: "Is it really free?", a: "Yes. The pilot is free for 30 days. If Vult is worth it, you choose a plan afterwards; if not, you stop and we delete your data." },
      { q: "Do I have to connect my bank?", a: "No. You upload a statement file exported from your home banking. Nothing can move money." },
      { q: "Where is my data stored?", a: "On servers in the European Union. Each company's data is isolated by the database itself, and we never sell or share it." },
      { q: "Does it replace my accountant or my invoicing software?", a: "No. Vult works next to them: it reads the invoices you already send through SDI and the movements in your bank." },
    ],
  },
  it: {
    title: "Accesso anticipato",
    eyebrow: "Accesso anticipato · prova gratuita di 30 giorni",
    lead: "Sai chi ha pagato.",
    rest: "Incassi prima.",
    sub: "Inviaci le fatture elettroniche e un estratto conto. In un giorno lavorativo vedi ogni pagamento abbinato alla sua fattura, chi ti deve ancora dei soldi e quanto tempo risparmia il tuo team.",
    cta: "Richiedi l'accesso",
    secondary: "Come funziona",
    problemEyebrow: "Il problema",
    problemLead: "I tuoi soldi sono sul conto di qualcun altro.",
    problemRest: "E capire chi ha pagato costa giorni di lavoro ogni mese.",
    stats: [
      ["50–73 giorni", "il tempo medio con cui le imprese italiane pagano i fornitori (Cerved, 2025)"],
      ["~1 su 4", "le fatture B2B pagate in ritardo (Atradius, 2026)"],
      ["Ore", "ogni mese per abbinare movimenti bancari e fatture su Excel"],
    ],
    stepsEyebrow: "Come funziona la prova",
    stepsLead: "Tre passaggi, un giorno lavorativo.",
    steps: [
      [FileUp, "Invii i file", "Lo ZIP delle fatture scaricato dal portale dell'Agenzia delle Entrate e un estratto conto (camt.053 o CSV). Nessun collegamento alla banca."],
      [Sparkles, "Vult abbina tutto", "Ogni bonifico abbinato alle sue fatture, anche più fatture in un pagamento, note di credito, commissioni e Ri.Ba."],
      [Landmark, "Vedi la tua liquidità", "Chi ha pagato, chi ti deve, con quanto ritardo paga ogni cliente e chi sollecitare per primo."],
    ],
    getEyebrow: "Cosa ricevi",
    get: [
      "Uno spazio di lavoro configurato per te, con i tuoi dati reali",
      "Ogni pagamento abbinato; confermi solo i pochi casi dubbi",
      "Saldo, scaduto e abitudini di pagamento di ogni cliente",
      "Un report a fine prova: ore risparmiate e fatture incassate",
      "Contatto diretto con il team che costruisce Vult",
    ],
    formTitle: "Richiedi la tua prova.",
    formSub: "Questo mese accogliamo dieci aziende. Nessuna carta, nessun impegno.",
    faq: [
      { q: "È davvero gratuito?", a: "Sì. La prova è gratuita per 30 giorni. Se Vult ti è utile scegli un piano; altrimenti ti fermi e cancelliamo i tuoi dati." },
      { q: "Devo collegare la banca?", a: "No. Carichi un estratto conto esportato dall'home banking. Nessuno può muovere denaro." },
      { q: "Dove sono conservati i dati?", a: "Su server nell'Unione Europea. I dati di ogni azienda sono isolati dal database stesso e non li vendiamo né li condividiamo." },
      { q: "Sostituisce il commercialista o il gestionale?", a: "No. Vult lavora accanto a loro: legge le fatture che già invii tramite SDI e i movimenti della tua banca." },
    ],
  },
} as const;

/** Moving rows of a bank statement that snap onto their invoice: the whole product in one image. */
function MatchStrip() {
  const reduce = useReducedMotion();
  const rows = [
    ["BONIFICO PASTIFICIO AURORA", "FT 2026/118", "€3,050.00"],
    ["SALDO FT 120 125 · OFFICINE BRENTA", "FT 120 + 125 − NC 7", "€6,200.00"],
    ["ACCREDITO DISTINTA RIBA", "3 Ri.Ba.", "€4,160.50"],
  ];
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(([bank, invoice, amount], i) => (
        <motion.div
          key={bank}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.25, duration: 0.45 }}
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-[13px] shadow-[0_1px_2px_rgb(16_17_26/0.05)]"
        >
          <span className="truncate font-mono text-ink-2">{bank}</span>
          <motion.span
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.75 + i * 0.25, type: "spring", stiffness: 300, damping: 18 }}
            className="flex size-6 items-center justify-center rounded-full bg-[#e5f4e4] text-[#1f8a4c]"
          >
            <Check className="size-3.5" />
          </motion.span>
          <span className="flex items-center justify-between gap-2 font-medium text-ink">
            <span className="truncate">{invoice}</span>
            <span className="tabular shrink-0 text-subtle">{amount}</span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export default function EarlyAccessPage({ lang = "en" }: { lang?: "en" | "it" }) {
  const t = COPY[lang];
  useDocumentTitle(t.title);
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = prev;
    };
  }, [lang]);
  const scrollToForm = () => document.getElementById("pilot")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div aria-hidden className="vlines absolute inset-x-0 bottom-0 top-[55%] [mask-image:linear-gradient(to_bottom,transparent,#000_60%)]" />
        <div className="rail relative grid items-center gap-12 px-[clamp(20px,5vw,60px)] pb-[clamp(56px,7vw,96px)] pt-[clamp(64px,9vw,112px)] lg:grid-cols-[1.1fr_1fr]">
          <Reveal className="flex flex-col gap-6">
            <Eyebrow className="self-start">{t.eyebrow}</Eyebrow>
            <h1 className="display text-balance text-[clamp(40px,5.6vw,68px)] font-semibold leading-[0.98] tracking-[-0.02em]">
              {t.lead} <span className="text-tone">{t.rest}</span>
            </h1>
            <p className="max-w-[520px] text-[18px] leading-[1.45] text-subtle">{t.sub}</p>
            <div className="flex flex-wrap gap-2.5">
              <Button size="lg" onClick={scrollToForm}>{t.cta}</Button>
              <Button href="/architecture" variant="secondary" size="lg">{t.secondary}</Button>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <MatchStrip />
          </Reveal>
        </div>
      </section>

      <section className="border-b border-line bg-soft">
        <div className="rail px-[clamp(20px,5vw,60px)] py-[clamp(56px,7vw,96px)]">
          <SectionIntro eyebrow={t.problemEyebrow} lead={t.problemLead} rest={t.problemRest} />
          <RevealGroup className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {t.stats.map(([v, l]) => (
              <RevealItem key={v} className="bg-white px-7 py-8">
                <p className="display text-[36px] font-medium leading-none tracking-[-0.03em]">{v}</p>
                <p className="mt-2 text-sm text-ink-2">{l}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="rail px-[clamp(20px,5vw,60px)] py-[clamp(56px,7vw,96px)]">
          <SectionIntro eyebrow={t.stepsEyebrow} lead={t.stepsLead} />
          <RevealGroup className="mt-10 grid gap-4 md:grid-cols-3">
            {t.steps.map(([Icon, title, desc], i) => (
              <RevealItem key={title} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6">
                <span className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon className="size-[18px]" /></span>
                  <span className="text-sm font-semibold text-subtle">0{i + 1}</span>
                </span>
                <p className="text-lg font-semibold text-ink">{title}</p>
                <p className="text-[15px] text-ink-2">{desc}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section id="pilot" className="scroll-mt-24 border-b border-line bg-soft">
        <div className="rail grid gap-12 px-[clamp(20px,5vw,60px)] py-[clamp(56px,7vw,96px)] lg:grid-cols-[1fr_1.1fr]">
          <Reveal className="flex flex-col gap-6">
            <Eyebrow className="self-start">{t.getEyebrow}</Eyebrow>
            <TwoTone lead={t.formTitle} rest={t.formSub} className="text-[clamp(28px,3vw,38px)] leading-[1.12]" />
            <ul className="flex flex-col gap-3">
              {t.get.map((g) => (
                <li key={g} className="flex gap-2.5 text-[15px] text-ink-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {g}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <EarlyAccessForm lang={lang} source={lang === "it" ? "landing-it" : "landing-en"} />
          </Reveal>
        </div>
      </section>

      <FAQ items={[...t.faq]} title={lang === "it" ? "Domande," : "Questions,"} subtitle={lang === "it" ? "risposte." : "answered."} />
    </>
  );
}
