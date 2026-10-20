import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { GlowCTA, Reveal, SectionIntro } from "@/components/marketing/Section";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";

const ROLES = [
  { title: "Senior Frontend Engineer", team: "Engineering", location: "Remote · Europe", type: "Full-time" },
  { title: "Staff Backend Engineer, Data Platform", team: "Engineering", location: "Remote · Americas", type: "Full-time" },
  { title: "Applied AI Engineer, Agents", team: "Engineering", location: "London or remote", type: "Full-time" },
  { title: "Product Designer", team: "Design", location: "Remote · Europe", type: "Full-time" },
  { title: "Account Executive, Mid-market", team: "Sales", location: "New York", type: "Full-time" },
  { title: "Solutions Engineer", team: "Sales", location: "Amsterdam", type: "Full-time" },
  { title: "Customer Success Manager", team: "Customer Success", location: "Remote · Americas", type: "Full-time" },
  { title: "Content Marketing Lead", team: "Marketing", location: "Remote", type: "Contract" },
];
const TEAMS = ["All", ...Array.from(new Set(ROLES.map((r) => r.team)))];

export default function CareersPage() {
  useDocumentTitle("Careers");
  const [team, setTeam] = useState("All");
  const shown = ROLES.filter((r) => team === "All" || r.team === team);
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="rail px-[clamp(20px,5vw,60px)] pb-12 pt-[clamp(64px,9vw,112px)]">
          <SectionIntro eyebrow="Careers" lead="Do the best work of your career." rest="Small teams, real ownership, and a product people open every morning." />
        </div>
      </section>
      <section className="border-b border-line bg-soft">
        <div className="rail px-[clamp(20px,5vw,60px)] py-12">
          <Reveal className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">{shown.length} open roles</h2>
            <label className="flex items-center gap-2 text-sm text-ink-2">
              Team
              <select value={team} onChange={(e) => setTeam(e.target.value)} className="h-9 rounded-btn border border-line-strong bg-white px-2.5 text-sm">
                {TEAMS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
          </Reveal>
          <ul className="overflow-hidden rounded-card border border-line bg-white">
            {shown.map((r) => (
              <li key={r.title} className="border-b border-line last:border-b-0">
                <a href={`mailto:jobs@vult.example?subject=${encodeURIComponent(r.title)}`} className={cn("group grid items-center gap-1 px-6 py-5 transition-colors hover:bg-soft sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:gap-4")}>
                  <span className="font-semibold text-ink">{r.title}</span>
                  <span className="text-sm text-ink-2">{r.team}</span>
                  <span className="text-sm text-subtle">{r.location} · {r.type}</span>
                  <ArrowUpRight aria-hidden className="hidden size-4 text-subtle transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <GlowCTA title="Don’t see your role? Say hello." primary="Start for free" secondary="Contact us" />
    </>
  );
}
