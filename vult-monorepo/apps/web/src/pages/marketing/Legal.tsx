import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CONTACT_EMAIL, LEGAL_ENTITY } from "@/lib/site";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";
import NotFoundPage from "./NotFound";

interface Doc {
  title: string;
  updated: string;
  intro: string;
  sections: { id: string; title: string; body: string[] }[];
}

// The legal entity behind Vult is set at build time; brackets show what is still missing.
const ENTITY = LEGAL_ENTITY;
const PRIVACY_EMAIL = CONTACT_EMAIL;
const UPDATED = "October 24, 2026";

const DOCS: Record<string, Doc> = {
  privacy: {
    title: "Privacy Policy",
    updated: UPDATED,
    intro: `This policy explains what personal data Vult processes during the early-access programme, why, and what you can do about it. Vult is operated by ${ENTITY}.`,
    sections: [
      { id: "roles", title: "1. Who is responsible", body: [
        `For your account and for early-access requests sent through our website, ${ENTITY} is the data controller.`,
        "For the invoices and bank statements you upload, your company is the controller and Vult processes them on your behalf, as your data processor under Article 28 GDPR. We sign a data processing agreement (DPA) with every company before it uploads data.",
      ] },
      { id: "collect", title: "2. What we process", body: [
        "Account data: your name, work email, company name, optional Partita IVA, and a hashed password.",
        "Early-access requests: name, email, company, role, approximate invoice volume and your message.",
        "Workspace data you upload: electronic invoices (customers, amounts, dates, payment terms) and bank statements (dates, amounts, payer names, IBANs, descriptions). Invoices to sole traders can contain personal data.",
        "Technical data: server logs with time, address requested, response status and an anonymous request id. We do not use analytics or advertising trackers.",
      ] },
      { id: "use", title: "3. Why we process it", body: [
        "To run the service you asked for: matching payments to invoices and showing balances (performance of a contract, Art. 6(1)(b) GDPR).",
        "To answer early-access requests and set up pilots (pre-contractual steps, Art. 6(1)(b)).",
        "To keep the service secure and working (legitimate interest, Art. 6(1)(f)), and to meet legal obligations such as tax records (Art. 6(1)(c)).",
        "We do not sell personal data, do not use it for advertising, and do not use workspace data to train AI models.",
      ] },
      { id: "where", title: "4. Where it is stored", body: [
        "On servers located in the European Union. Each company's data is isolated by the database itself (row-level security), and the application cannot read across companies.",
        "We use a small number of providers to run the service (hosting, email delivery). They act as sub-processors under contracts with GDPR safeguards. The current list is available on request.",
      ] },
      { id: "retention", title: "5. How long we keep it", body: [
        "Workspace data: while your company uses Vult. If you stop after the pilot or close your account, we delete it within 30 days, and from backups within a further 14 days.",
        "Account data: while the account exists. Early-access requests: up to 12 months if no pilot starts.",
        "Server logs: up to 30 days.",
      ] },
      { id: "rights", title: "6. Your rights", body: [
        `You can ask to access, correct, delete or export your personal data, to restrict or object to processing, by writing to ${PRIVACY_EMAIL}. We answer within 30 days.`,
        "For data in a workspace, write to the company that uses Vult: it decides about that data, and we help it answer.",
        "You can also complain to the Italian data protection authority, the Garante per la protezione dei dati personali (garanteprivacy.it).",
      ] },
      { id: "security", title: "7. Security", body: [
        "Connections are encrypted (HTTPS). Passwords are stored as scrypt hashes. Sessions use secure, httpOnly cookies, and changes require a protection header against cross-site requests.",
        "Access to production systems is limited to the people who run the service.",
      ] },
      { id: "cookies", title: "8. Cookies", body: [
        "We use one cookie, vult_session, to keep you signed in. It is strictly necessary, so it needs no consent. The site also remembers small preferences (for example a dismissed banner) in your browser's local storage.",
      ] },
      { id: "changes", title: "9. Changes", body: ["If we change this policy in a way that matters, we tell you by email before the change applies."] },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: UPDATED,
    intro: `These terms apply to the use of Vult during the early-access programme. Vult is provided by ${ENTITY}.`,
    sections: [
      { id: "agreement", title: "1. Agreement", body: ["By creating a workspace or using Vult you accept these terms on behalf of the company you represent, and confirm you are allowed to do so."] },
      { id: "service", title: "2. The service", body: [
        "Vult reads the electronic invoices and bank statements you upload, matches payments to invoices, and shows balances and overdue amounts. It does not move money, does not access your bank account, and does not send invoices to SDI on your behalf.",
        "Vult is in early access: features change often and the service may occasionally be unavailable. Automatic matches are suggestions you can review and undo; check important figures before acting on them.",
      ] },
      { id: "pilot", title: "3. Free pilot and plans", body: [
        "Each workspace starts with a free 30-day pilot. No payment details are needed for the pilot.",
        "After the pilot you can choose a paid plan, priced by the number of invoices imported per month, in euros, VAT excluded. Paid plans renew monthly or yearly until cancelled; you can cancel at any time with effect from the end of the current period.",
      ] },
      { id: "data", title: "4. Your data", body: [
        "Your company owns the data it uploads. We process it only to provide the service, under the data processing agreement and the Privacy Policy.",
        "You are responsible for having the right to upload the invoices and statements, and for their content. You can export or delete your data at any time.",
      ] },
      { id: "accounts", title: "5. Accounts and acceptable use", body: [
        "Keep your password safe; activity in your workspace is your responsibility.",
        "Do not try to access other companies' data, disrupt the service, or use it for unlawful purposes.",
      ] },
      { id: "liability", title: "6. Liability", body: [
        "During the free pilot the service is provided as is. To the extent allowed by law, our total liability for paid plans is limited to the fees paid in the twelve months before the claim, and we are not liable for indirect losses. Nothing limits liability for wilful misconduct or gross negligence.",
      ] },
      { id: "termination", title: "7. Ending the service", body: ["You can stop at any time. We may suspend a workspace that breaches these terms, with notice where possible. When a workspace closes, its data is deleted as described in the Privacy Policy."] },
      { id: "law", title: "8. Law", body: ["These terms are governed by Italian law. Mandatory consumer and data protection rules still apply where relevant."] },
      { id: "contact", title: "9. Contact", body: [`Questions about these terms: ${PRIVACY_EMAIL}.`] },
    ],
  },
};

export default function LegalPage({ doc }: { doc: string }) {
  const d = DOCS[doc];
  useDocumentTitle(d?.title ?? "Not found");
  const [active, setActive] = useState(d?.sections[0]?.id ?? "");

  useEffect(() => {
    if (!d) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    d.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [d]);

  if (!d) return <NotFoundPage />;

  return (
    <div className="bg-white">
      <div className="rail grid gap-10 px-[clamp(20px,5vw,60px)] py-[clamp(56px,8vw,96px)] lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="On this page">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-subtle">On this page</p>
            <ol className="flex gap-1 overflow-x-auto border-l border-line lg:flex-col">
              {d.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                      setActive(s.id);
                    }}
                    aria-current={active === s.id ? "location" : undefined}
                    className={cn("-ml-px block whitespace-nowrap border-l-2 py-1 pl-3 text-[13.5px] transition-colors", active === s.id ? "border-accent font-medium text-ink" : "border-transparent text-subtle hover:text-ink")}
                  >
                    {s.title.replace(/^\d+\.\s*/, "")}
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[13px] text-subtle">
              See also:{" "}
              <Link href={doc === "privacy" ? "/legal/terms" : "/legal/privacy"} className="text-accent hover:underline">
                {doc === "privacy" ? "Terms of Service" : "Privacy Policy"}
              </Link>
            </p>
          </nav>
        </aside>
        <article className="max-w-[720px]">
          <h1 className="text-[clamp(32px,4vw,44px)] font-semibold tracking-[-0.04em]">{d.title}</h1>
          <p className="mt-2 text-sm text-subtle">Last updated {d.updated}</p>
          <p className="mt-6 rounded-xl border border-line bg-soft p-4 text-[15px] leading-relaxed text-ink-2">{d.intro}</p>
          {d.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 pt-10">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 text-[15.5px] leading-[1.7] text-ink-2">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
