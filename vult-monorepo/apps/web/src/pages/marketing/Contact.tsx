import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Mail, MessagesSquare, Building } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Reveal, TwoTone } from "@/components/marketing/Section";
import { Eyebrow } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

type Form = { name: string; email: string; company: string; size: string; message: string };
const EMPTY: Form = { name: "", email: "", company: "", size: "", message: "" };

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.name.trim()) e.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid work email.";
  if (!f.company.trim()) e.company = "Enter your company name.";
  if (!f.size) e.size = "Choose a team size.";
  if (f.message.trim().length < 10) e.message = "Tell us a little more (at least 10 characters).";
  return e;
}

export default function ContactPage() {
  useDocumentTitle("Contact sales");
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      document.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] select, [data-field="${first}"] textarea`)?.focus();
      return;
    }
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 800);
  };

  return (
    <section className="border-b border-line bg-soft">
      <div className="rail grid gap-12 px-[clamp(20px,5vw,60px)] py-[clamp(64px,9vw,112px)] lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="flex flex-col gap-6">
          <Eyebrow className="self-start">Contact sales</Eyebrow>
          <TwoTone as="h1" lead="Talk to our team." rest="See Vult with your own data, get pricing for your team, or plan an enterprise rollout." className="text-[clamp(32px,4vw,48px)] leading-[1.08]" />
          <ul className="mt-2 flex flex-col gap-4 text-ink-2">
            {[
              [MessagesSquare, "A 30-minute walkthrough tailored to your sales process"],
              [Building, "Security review, SSO and data residency for enterprise"],
              [Mail, "Prefer email? sales@vult.example"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof Mail;
              return (
                <li key={t as string} className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white">
                    <I aria-hidden className="size-4" />
                  </span>
                  <span className="pt-1">{t as string}</span>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="rounded-panel border border-line bg-white p-[clamp(20px,4vw,36px)] shadow-card">
          <AnimatePresence mode="wait">
            {status === "sent" ? (
              <motion.div key="done" role="status" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
                <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}>
                  <CheckCircle2 className="size-12 text-success" />
                </motion.span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">Thanks, {form.name.split(" ")[0]}!</h2>
                <p className="max-w-[340px] text-ink-2">We’ve got your message. Someone from our team will reply to {form.email} within one business day.</p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setForm(EMPTY);
                    setStatus("idle");
                  }}
                >
                  Send another message
                </Button>
              </motion.div>
            ) : (
              <motion.form key="form" noValidate onSubmit={submit} exit={{ opacity: 0, y: -8 }} className="grid gap-4 sm:grid-cols-2">
                <div data-field="name">
                  <Field label="Full name" error={errors.name}>
                    {(p) => <Input {...p} autoComplete="name" value={form.name} onChange={set("name")} />}
                  </Field>
                </div>
                <div data-field="email">
                  <Field label="Work email" error={errors.email}>
                    {(p) => <Input {...p} type="email" autoComplete="email" value={form.email} onChange={set("email")} />}
                  </Field>
                </div>
                <div data-field="company">
                  <Field label="Company" error={errors.company}>
                    {(p) => <Input {...p} autoComplete="organization" value={form.company} onChange={set("company")} />}
                  </Field>
                </div>
                <div data-field="size">
                  <Field label="Team size" error={errors.size}>
                    {(p) => (
                      <Select {...p} value={form.size} onChange={set("size")}>
                        <option value="">Select…</option>
                        <option>1–10</option>
                        <option>11–50</option>
                        <option>51–200</option>
                        <option>201–1,000</option>
                        <option>1,000+</option>
                      </Select>
                    )}
                  </Field>
                </div>
                <div data-field="message" className="sm:col-span-2">
                  <Field label="How can we help?" error={errors.message}>
                    {(p) => <Textarea {...p} rows={5} value={form.message} onChange={set("message")} placeholder="Tell us about your team and what you’d like to see." />}
                  </Field>
                </div>
                <Button type="submit" size="lg" disabled={status === "sending"} className="sm:col-span-2">
                  {status === "sending" ? "Sending…" : "Contact sales"}
                </Button>
                <p className="text-xs text-subtle sm:col-span-2">Demo form — nothing is sent anywhere.</p>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}
