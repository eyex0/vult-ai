import { useEffect, useRef, useState } from "react";
import { useDB } from "@/data/store";
import type { EditorKind } from "./columns";

const cls = "h-full w-full bg-app-input px-3 text-[13px] text-white outline-none ring-2 ring-inset ring-accent";

/** In-place editor for a table cell. Enter or blur commits, Escape cancels. */
export function CellEditor({
  kind,
  options,
  initial,
  align,
  label,
  onCommit,
  onCancel,
}: {
  kind: EditorKind;
  options?: readonly string[];
  initial: string | number;
  align?: "left" | "right";
  label: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const db = useDB();
  const [value, setValue] = useState(String(initial ?? ""));
  const ref = useRef<HTMLInputElement & HTMLSelectElement>(null);
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    if (ref.current && "select" in ref.current && kind !== "select" && kind !== "member" && kind !== "company") ref.current.select?.();
  }, [kind]);

  const commit = (v = value) => {
    if (done.current) return;
    done.current = true;
    if (v !== String(initial)) onCommit(v);
    else onCancel();
  };
  const cancel = () => {
    done.current = true;
    onCancel();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  if (kind === "select" || kind === "member" || kind === "company") {
    const opts =
      kind === "member"
        ? db.members.map((m) => [m.id, m.name] as const)
        : kind === "company"
          ? db.companies.map((c) => [c.id, c.name] as const)
          : (options ?? []).map((o) => [o, o] as const);
    return (
      <select
        ref={ref}
        aria-label={label}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => commit()}
        onKeyDown={onKeyDown}
        className={cls + " cursor-pointer"}
      >
        {opts.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={ref}
      aria-label={label}
      type={kind === "number" ? "number" : kind === "date" ? "date" : kind === "email" ? "email" : "text"}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => commit()}
      onKeyDown={onKeyDown}
      className={cls + (align === "right" ? " text-right" : "") + " [color-scheme:dark]"}
    />
  );
}
