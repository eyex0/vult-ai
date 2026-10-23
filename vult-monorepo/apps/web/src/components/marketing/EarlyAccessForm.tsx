import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { API_MODE, apiFetch, postJson, sessionConnection } from "@/lib/api";
import { CONTACT_EMAIL } from "@/lib/site";


const COPY = {
  en: {
    name: "Full name",
    email: "Work email",
    company: "Company",
    role: "Your role",
    roles: ["Owner or CEO", "Finance or administration", "Sales", "Accountant (commercialista)", "Other"],
    invoices: "Invoices you issue per month",
    message: "Anything we should know? (optional)",
    messagePlaceholder: "The bank you use, your invoicing software, what takes most time today…",
    submit: "Request early access",
    sending: "Sending…",
    done: "Thank you. We'll write to you within one working day to set up your free pilot.",
    errors: { name: "Enter your name.", email: "Enter a valid work email.", company: "Enter your company." },
    privacy: "We use these details only to contact you about Vult.",
  },
  it: {
    name: "Nome e cognome",
    email: "Email di lavoro",
    company: "Azienda",
    role: "Il tuo ruolo",
    roles: ["Titolare o CEO", "Amministrazione e finanza", "Commerciale", "Commercialista", "Altro"],
    invoices: "Fatture emesse al mese",
    message: "Qualcosa da aggiungere? (facoltativo)",
    messagePlaceholder: "La banca che usate, il gestionale di fatturazione, cosa vi porta via più tempo…",
    submit: "Richiedi l'accesso anticipato",
    sending: "Invio in corso…",
    done: "Grazie. Ti scriviamo entro un giorno lavorativo per attivare la prova gratuita.",
    errors: { name: "Inserisci il tuo nome.", email: "Inserisci un'email di lavoro valida.", company: "Inserisci l'azienda." },
    privacy: "Usiamo questi dati solo per contattarti riguardo a Vult.",
  },
} as const;

const BUCKETS = ["<50", "50-200", "200-1000", ">1000"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EarlyAccessForm({ lang = "en", source }: { lang?: "en" | "it"; source?: string }) {
  const t = COPY[lang];
  const [form, setForm] = useState({ name: "", email: "", company: "", role: t.roles[0] as string, invoicesPerMonth: "50-200", message: "", website: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "company" | "form", string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = t.errors.name;
    if (!EMAIL_RE.test(form.email.trim())) next.email = t.errors.email;
    if (!form.company.trim()) next.company = t.errors.company;
    setErrors(next);
    if (Object.keys(next).length) return;
    setState("sending");
    try {
      if (API_MODE) {
        await apiFetch(sessionConnection, "/leads", postJson({ ...form, message: form.message || undefined, language: lang, source }));
      } else {
        // Static preview: hand the request to the visitor's mail app.
        const body = `${form.name}\n${form.company}\n${form.role}\n${t.invoices}: ${form.invoicesPerMonth}\n\n${form.message}`;
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Vult early access")}&body=${encodeURIComponent(body)}`;
      }
      setState("done");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong" });
      setState("idle");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {state === "done" ? (
        <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status" className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-white p-6">
          <CheckCircle2 className="size-7 text-[#2bb673]" />
          <p className="text-[17px] font-medium text-ink">{t.done}</p>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-[0_24px_64px_-36px_rgb(16_17_26/0.3)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.name} error={errors.name}>{(p) => <Input {...p} autoComplete="name" value={form.name} onChange={set("name")} />}</Field>
            <Field label={t.email} error={errors.email}>{(p) => <Input {...p} type="email" autoComplete="email" value={form.email} onChange={set("email")} />}</Field>
            <Field label={t.company} error={errors.company}>{(p) => <Input {...p} autoComplete="organization" value={form.company} onChange={set("company")} />}</Field>
            <Field label={t.role}>
              {(p) => (
                <Select {...p} value={form.role} onChange={set("role")}>
                  {t.roles.map((r) => <option key={r}>{r}</option>)}
                </Select>
              )}
            </Field>
          </div>
          <Field label={t.invoices}>
            {(p) => (
              <Select {...p} value={form.invoicesPerMonth} onChange={set("invoicesPerMonth")}>
                {BUCKETS.map((b) => <option key={b} value={b}>{b.replace("<", "< ").replace(">", "> ").replace("-", " – ")}</option>)}
              </Select>
            )}
          </Field>
          <Field label={t.message}>{(p) => <Textarea {...p} value={form.message} onChange={set("message")} placeholder={t.messagePlaceholder} />}</Field>
          {/* Honeypot for bots: hidden from people and from assistive technology. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={set("website")} />
          {errors.form && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{errors.form}</p>}
          <Button type="submit" size="lg" disabled={state === "sending"} className="self-start">
            {state === "sending" ? t.sending : t.submit}
          </Button>
          <p className="text-xs text-subtle">{t.privacy}</p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
