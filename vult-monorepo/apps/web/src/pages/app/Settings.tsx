import { motion } from "framer-motion";
import { Check, CreditCard, Download, Settings as SettingsIcon, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";
import { InviteModal } from "@/components/app/AppShell";
import { usePage } from "@/components/app/PageMeta";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { store, useDB } from "@/data/store";
import type { Member } from "@/data/types";
import { signIn, useSession } from "@/lib/session";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TABS = [
  ["profile", "Profile"],
  ["workspace", "Workspace"],
  ["members", "Members"],
  ["billing", "Billing"],
] as const;

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-app-line py-7 md:grid-cols-[240px_1fr]">
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {desc && <p className="mt-1 text-[13px] text-app-mute">{desc}</p>}
      </div>
      <div className="flex max-w-[520px] flex-col gap-4">{children}</div>
    </section>
  );
}

function Profile() {
  const session = useSession();
  const [name, setName] = useState(session?.name ?? "");
  const [email] = useState(session?.email ?? "");
  return (
    <>
      <Section title="Your profile" desc="How you appear to teammates.">
        <div className="flex items-center gap-3">
          <Avatar name={name || "You"} size={48} />
          <Button variant="secondary" size="sm" onClick={() => toast("Photo upload is not available in the demo")}>
            Change photo
          </Button>
        </div>
        <Field label="Full name">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Email" hint="Managed by your sign-in provider.">
          {(p) => <Input {...p} value={email} disabled />}
        </Field>
        <Button
          className="self-start"
          onClick={() => {
            if (session) signIn(session.email, name);
            toast.success("Profile saved");
          }}
        >
          Save changes
        </Button>
      </Section>
      <Section title="Preferences">
        <Field label="Time zone">
          {(p) => (
            <Select {...p} defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}>
              {[Intl.DateTimeFormat().resolvedOptions().timeZone, "Europe/London", "Europe/Rome", "America/New_York", "America/Los_Angeles", "Asia/Singapore"].filter((v, i, a) => a.indexOf(v) === i).map((z) => (
                <option key={z}>{z}</option>
              ))}
            </Select>
          )}
        </Field>
      </Section>
    </>
  );
}

function WorkspaceTab() {
  const db = useDB();
  const [name, setName] = useState(db.workspace.name);
  const [domain, setDomain] = useState(db.workspace.domain);
  return (
    <>
      <Section title="Workspace" desc="Visible to everyone in the workspace.">
        <Field label="Workspace name">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Company domain" hint="People with this email domain can request to join.">
          {(p) => <Input {...p} value={domain} onChange={(e) => setDomain(e.target.value)} />}
        </Field>
        <Button
          className="self-start"
          onClick={() => {
            store.setWorkspace({ name: name.trim() || db.workspace.name, domain });
            toast.success("Workspace updated");
          }}
        >
          Save changes
        </Button>
      </Section>
      <Section title="Demo data" desc="Restore the original fictional records. Your changes will be lost.">
        <Button variant="danger" className="self-start" onClick={() => store.reset()}>
          <Trash2 className="size-3.5" /> Reset demo data
        </Button>
      </Section>
    </>
  );
}

function Members() {
  const db = useDB();
  const [invite, setInvite] = useState(false);
  return (
    <Section title="Members" desc={`${db.members.length} people have access to ${db.workspace.name}.`}>
      <Button className="self-start" onClick={() => setInvite(true)}>
        <UserPlus className="size-3.5" /> Invite members
      </Button>
      <ul className="overflow-hidden rounded-xl border border-app-line">
        {db.members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 border-b border-app-line-soft px-4 py-3 last:border-b-0">
            <Avatar name={m.name} size={30} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-[550] text-white">{m.name}</span>
              <span className="truncate text-xs text-app-mute">{m.email}</span>
            </span>
            <label className="sr-only" htmlFor={`role-${m.id}`}>
              Role for {m.name}
            </label>
            <select
              id={`role-${m.id}`}
              value={m.role}
              disabled={m.id === "m1"}
              onChange={(e) => store.update("members", m.id, { role: e.target.value as Member["role"] })}
              className="h-8 rounded-[7px] border border-[#2e3033] bg-app-input px-2 text-[13px] text-white disabled:opacity-60"
            >
              <option>Admin</option>
              <option>Member</option>
              <option>Guest</option>
            </select>
            {m.id !== "m1" && (
              <button type="button" aria-label={`Remove ${m.name}`} onClick={() => store.remove("members", [m.id], "member")} className="inline-flex size-8 items-center justify-center rounded-md text-app-mute hover:bg-app-hover hover:text-[#f59090]">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <InviteModal open={invite} onOpenChange={setInvite} />
    </Section>
  );
}

const PLANS = [
  { name: "Plus", price: 23, features: ["Unlimited objects", "Sequences", "1,000 enrichment credits"] },
  { name: "Pro", price: 55, features: ["Vult Agents", "Advanced workflows", "Custom dashboards"] },
  { name: "Enterprise", price: 0, features: ["SSO & SCIM", "Audit logs", "Data residency"] },
] as const;

function Billing() {
  const db = useDB();
  const days = Math.max(0, Math.ceil((new Date(db.workspace.trialEndsAt).getTime() - Date.now()) / 86400000));
  return (
    <>
      <Section title="Plan" desc={`You’re on a Pro trial · ${days} days left.`}>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((p) => {
            const current = db.workspace.plan === p.name;
            return (
              <motion.button
                key={p.name}
                type="button"
                whileHover={{ y: -2 }}
                transition={spring}
                aria-pressed={current}
                onClick={() => {
                  store.setWorkspace({ plan: p.name });
                  toast.success(`Switched to ${p.name} (demo — no payment taken)`);
                }}
                className={cn("flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors", current ? "border-app-accent bg-[#151830]" : "border-app-line bg-app-panel hover:border-[#34363c]")}
              >
                <span className="flex items-center justify-between font-semibold text-white">
                  {p.name} {current && <Check className="size-4 text-app-accent" />}
                </span>
                <span className="text-[13px] text-app-dim">{p.price ? `$${p.price}/seat/mo` : "Custom"}</span>
                <ul className="mt-1 flex flex-col gap-1 text-xs text-app-mute">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </motion.button>
            );
          })}
        </div>
        <Link href="/pricing" className="text-[13px] text-[#9daeff] hover:text-white">
          Compare all plans →
        </Link>
      </Section>
      <Section title="Payment method">
        <div className="flex items-center gap-3 rounded-xl border border-app-line p-4">
          <CreditCard aria-hidden className="size-5 text-app-dim" />
          <span className="flex-1 text-[13px] text-app-dim">No payment method on file.</span>
          <Button variant="secondary" size="sm" onClick={() => toast("Payments are disabled in the demo")}>
            Add card
          </Button>
        </div>
      </Section>
      <Section title="Invoices">
        <div className="overflow-x-auto rounded-xl border border-app-line">
          <table className="w-full min-w-[420px] text-[13px]">
            <thead>
              <tr className="text-left text-app-mute">
                {["Date", "Description", "Amount", ""].map((h, i) => (
                  <th key={i} scope="col" className="border-b border-app-line px-4 py-2 font-medium">
                    {h || <span className="sr-only">Download</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Sep 1, 2026", "Plus · 4 seats", "$92.00"],
                ["Aug 1, 2026", "Plus · 4 seats", "$92.00"],
                ["Jul 1, 2026", "Plus · 3 seats", "$69.00"],
              ].map(([d, desc, amt]) => (
                <tr key={d}>
                  <td className="border-b border-app-line-soft px-4 py-2.5 text-app-dim">{d}</td>
                  <td className="border-b border-app-line-soft px-4 py-2.5">{desc}</td>
                  <td className="tabular border-b border-app-line-soft px-4 py-2.5">{amt}</td>
                  <td className="border-b border-app-line-soft px-4 py-2.5 text-right">
                    <button type="button" aria-label={`Download invoice ${d}`} onClick={() => toast("Sample invoice — nothing to download")} className="inline-flex size-7 items-center justify-center rounded-md text-app-mute hover:bg-app-hover hover:text-white">
                      <Download className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Badge dark tone="neutral" className="self-start">
          Sample invoices
        </Badge>
      </Section>
    </>
  );
}

export default function SettingsPage() {
  const { tab = "profile" } = useParams<{ tab?: string }>();
  usePage({ title: "Settings", icon: SettingsIcon });
  const active = TABS.some(([t]) => t === tab) ? tab : "profile";
  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto border-b border-app-line px-4">
        {TABS.map(([t, label]) => (
          <Link key={t} href={`/app/settings/${t}`} aria-current={active === t ? "page" : undefined} className={cn("relative flex h-10 items-center px-2.5 text-[13.5px] font-[550] transition-colors", active === t ? "text-white" : "text-app-mute hover:text-white")}>
            {label}
            {active === t && <motion.span layoutId="settings-tab" transition={spring} className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-accent" />}
          </Link>
        ))}
      </nav>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 sm:px-8">
        <div className="mx-auto max-w-[920px]">
          {active === "profile" && <Profile />}
          {active === "workspace" && <WorkspaceTab />}
          {active === "members" && <Members />}
          {active === "billing" && <Billing />}
        </div>
      </div>
    </div>
  );
}
