import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";
import NotFoundPage from "./NotFound";

interface Doc {
  title: string;
  updated: string;
  intro: string;
  sections: { id: string; title: string; body: string[] }[];
}

const DOCS: Record<string, Doc> = {
  privacy: {
    title: "Privacy Policy",
    updated: "October 1, 2026",
    intro: "This sample policy explains how a CRM like Vult handles personal data. It is placeholder text for a demo product and is not legal advice.",
    sections: [
      { id: "scope", title: "1. Scope", body: ["This policy covers information we process when you visit our website, create an account, or use the Vult application.", "Customers who store data about their own contacts in Vult act as the controller of that data; Vult processes it on their behalf."] },
      { id: "collect", title: "2. Information we collect", body: ["Account information such as your name, email address and workspace details.", "Usage information such as pages visited, features used and device information.", "Content you add to Vult, including records, notes, emails and files."] },
      { id: "use", title: "3. How we use information", body: ["To provide, maintain and improve the service.", "To secure accounts, prevent abuse and comply with legal obligations.", "To communicate with you about your account and product updates. You can opt out of marketing messages at any time."] },
      { id: "ai", title: "4. AI features", body: ["Agents and Ask Vult process workspace data only to answer your requests and perform the actions you approve.", "Workspace content is not used to train general-purpose models."] },
      { id: "sharing", title: "5. Sharing", body: ["We share information with sub-processors that help us operate the service, under contracts that require appropriate protection.", "We do not sell personal information."] },
      { id: "retention", title: "6. Retention", body: ["We keep account data for as long as your account is active. Workspace admins can delete records at any time; deleted data is purged from backups within 30 days."] },
      { id: "rights", title: "7. Your rights", body: ["Depending on where you live, you may have the right to access, correct, delete or export your personal data, and to object to certain processing.", "Contact privacy@vult.example to exercise these rights."] },
      { id: "security", title: "8. Security", body: ["Data is encrypted in transit and at rest. Access is limited to personnel who need it, and all access is logged."] },
      { id: "changes", title: "9. Changes", body: ["We will notify you of material changes by email or in the product before they take effect."] },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "October 1, 2026",
    intro: "These sample terms describe the agreement between a customer and a CRM provider. They are placeholder text for a demo product and are not legal advice.",
    sections: [
      { id: "agreement", title: "1. Agreement", body: ["By creating an account or using Vult you agree to these terms on behalf of yourself or the organisation you represent."] },
      { id: "accounts", title: "2. Accounts", body: ["You are responsible for activity under your account and for keeping your credentials secure.", "Workspace admins control who has access and what each member can do."] },
      { id: "use", title: "3. Acceptable use", body: ["Don’t use Vult to send spam, violate others’ rights, or attempt to break or overload the service.", "You are responsible for having a lawful basis to store and contact the people in your workspace."] },
      { id: "data", title: "4. Your data", body: ["You own the content you put into Vult. You grant us the limited rights needed to host and process it to provide the service.", "You can export your data at any time."] },
      { id: "billing", title: "5. Plans and billing", body: ["Paid plans are billed in advance per seat. Upgrades take effect immediately and are prorated; downgrades apply at the next renewal."] },
      { id: "ai", title: "6. AI features", body: ["Outputs from agents may be inaccurate. Review important actions before approving them. You remain responsible for messages sent from your workspace."] },
      { id: "termination", title: "7. Termination", body: ["You can cancel at any time. We may suspend accounts that breach these terms, with notice where practical."] },
      { id: "liability", title: "8. Liability", body: ["To the extent permitted by law, the service is provided as is, and our total liability is limited to the fees paid in the twelve months before a claim."] },
      { id: "contact", title: "9. Contact", body: ["Questions about these terms? Write to legal@vult.example."] },
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
