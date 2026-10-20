import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { OBJECT_META } from "@/data/selectors";
import { store, uid, useDB } from "@/data/store";
import { DEAL_STAGES, INDUSTRIES, SEGMENTS, type Company, type Deal, type Person, type RecordKind } from "@/data/types";

type Form = Record<string, string>;

const EMPTY: Record<RecordKind, Form> = {
  companies: { name: "", domain: "", industry: "Software", segment: "Mid-market", city: "", country: "" },
  people: { name: "", email: "", title: "", companyId: "" },
  deals: { name: "", companyId: "", value: "", stage: "Lead", closeDate: "" },
};

export function NewRecordModal({ kind, open, onOpenChange, onCreated }: { kind: RecordKind; open: boolean; onOpenChange: (v: boolean) => void; onCreated?: (id: string) => void }) {
  const db = useDB();
  const [form, setForm] = useState<Form>(EMPTY[kind]);
  const [errors, setErrors] = useState<Form>({});
  const meta = OBJECT_META[kind];

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY[kind], companyId: db.companies[0]?.id ?? "", closeDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind]);

  const set = (k: string) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: "" }));
  };

  const validate = (): Form => {
    const e: Form = {};
    if (!form.name?.trim()) e.name = `Give the ${meta.singular.toLowerCase()} a name.`;
    if (kind === "companies" && form.domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(form.domain)) e.domain = "Enter a domain like acme.com.";
    if (kind === "people" && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (kind === "deals" && form.value && !(Number(form.value) >= 0)) e.value = "Enter a positive number.";
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    const now = new Date().toISOString();
    const id = uid(kind[0]);
    if (kind === "companies") {
      const c: Company = {
        id, name: form.name!.trim(), domain: form.domain || form.name!.toLowerCase().replace(/[^a-z0-9]+/g, "") + ".example",
        industry: form.industry as Company["industry"], segment: form.segment as Company["segment"], employees: 0, arr: 0,
        city: form.city || "—", country: form.country || "—", ownerId: "m1", description: "", createdAt: now, lastInteraction: now,
      };
      store.create("companies", c);
      store.log({ kind, id }, "created", "Company created");
      store.tick("import");
    } else if (kind === "people") {
      const company = db.companies.find((c) => c.id === form.companyId);
      const p: Person = {
        id, name: form.name!.trim(), email: form.email || "", title: form.title || "—", companyId: form.companyId || "", phone: "", city: company?.city ?? "",
        strength: "Medium", ownerId: "m1", createdAt: now, lastInteraction: now,
      };
      store.create("people", p);
      store.log({ kind, id }, "created", "Person created");
    } else {
      const d: Deal = {
        id, name: form.name!.trim(), companyId: form.companyId || "", stage: form.stage as Deal["stage"], value: Number(form.value) || 0, ownerId: "m1",
        closeDate: new Date((form.closeDate || now.slice(0, 10)) + "T12:00:00").toISOString(), source: "Inbound", nextStep: "Book discovery call", createdAt: now,
      };
      store.create("deals", d);
      store.log({ kind, id }, "created", "Deal created");
      store.tick("deal");
    }
    toast.success(`${meta.singular} created`);
    onOpenChange(false);
    onCreated?.(id);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`New ${meta.singular.toLowerCase()}`}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Create {meta.singular.toLowerCase()}</Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="grid gap-3.5 sm:grid-cols-2"
      >
        <Field label="Name" error={errors.name} className="sm:col-span-2">
          {(p) => <Input {...p} autoFocus value={form.name ?? ""} onChange={set("name")} placeholder={kind === "people" ? "Ava Bennett" : kind === "deals" ? "Annual renewal" : "Acme"} />}
        </Field>
        {kind === "companies" && (
          <>
            <Field label="Domain" error={errors.domain} hint="We’ll enrich the rest automatically." className="sm:col-span-2">
              {(p) => <Input {...p} value={form.domain} onChange={set("domain")} placeholder="acme.com" />}
            </Field>
            <Field label="Industry">
              {(p) => (
                <Select {...p} value={form.industry} onChange={set("industry")}>
                  {INDUSTRIES.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Segment">
              {(p) => (
                <Select {...p} value={form.segment} onChange={set("segment")}>
                  {SEGMENTS.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="City">{(p) => <Input {...p} value={form.city} onChange={set("city")} />}</Field>
            <Field label="Country">{(p) => <Input {...p} value={form.country} onChange={set("country")} />}</Field>
          </>
        )}
        {kind === "people" && (
          <>
            <Field label="Email" error={errors.email}>
              {(p) => <Input {...p} type="email" value={form.email} onChange={set("email")} placeholder="ava@acme.com" />}
            </Field>
            <Field label="Job title">{(p) => <Input {...p} value={form.title} onChange={set("title")} placeholder="VP Sales" />}</Field>
          </>
        )}
        {(kind === "people" || kind === "deals") && (
          <Field label="Company" className="sm:col-span-2">
            {(p) => (
              <Select {...p} value={form.companyId} onChange={set("companyId")}>
                {db.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        {kind === "deals" && (
          <>
            <Field label="Value (USD)" error={errors.value}>
              {(p) => <Input {...p} type="number" min={0} value={form.value} onChange={set("value")} placeholder="25000" />}
            </Field>
            <Field label="Stage">
              {(p) => (
                <Select {...p} value={form.stage} onChange={set("stage")}>
                  {DEAL_STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Expected close" className="sm:col-span-2">
              {(p) => <Input {...p} type="date" value={form.closeDate} onChange={set("closeDate")} className="[color-scheme:dark]" />}
            </Field>
          </>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

/** Paste CSV (name,domain) to create companies in bulk. */
export function ImportModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [text, setText] = useState("name,domain\nAcme Robotics,acmerobotics.example\nBluefin Health,bluefin.example");
  const [error, setError] = useState("");
  const submit = () => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const body = /^name\s*,/i.test(lines[0] ?? "") ? lines.slice(1) : lines;
    if (!body.length) return setError("Add at least one row.");
    const now = new Date().toISOString();
    body.forEach((l) => {
      const [name, domain] = l.split(",").map((s) => s.trim());
      if (!name) return;
      store.create("companies", {
        id: uid("c"), name, domain: domain || name.toLowerCase().replace(/[^a-z0-9]+/g, "") + ".example", industry: "Software", segment: "SMB",
        employees: 0, arr: 0, city: "—", country: "—", ownerId: "m1", description: "", createdAt: now, lastInteraction: now,
      });
    });
    store.tick("import");
    toast.success(`Imported ${body.length} companies`);
    onOpenChange(false);
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Import companies"
      description="Paste CSV with a name and domain per line."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Import</Button>
        </>
      }
    >
      <Field label="CSV" error={error}>
        {(p) => <Textarea {...p} rows={8} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-[12.5px]" />}
      </Field>
    </Modal>
  );
}
