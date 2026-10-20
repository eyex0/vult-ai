import { motion } from "framer-motion";
import { Phone, PhoneMissed, Voicemail } from "lucide-react";
import { Link } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useDB } from "@/data/store";
import { formatDate } from "@/lib/format";

export default function CallsPage() {
  usePage({ title: "Calls", icon: Phone });
  const db = useDB();
  const calls = [...db.calls].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div className="scrollbar-thin h-full overflow-y-auto p-4 sm:p-6">
      <ul className="mx-auto flex max-w-[860px] flex-col gap-2.5">
        {calls.map((c, i) => {
          const person = db.people.find((p) => p.id === c.personId);
          const Icon = c.outcome === "Connected" ? Phone : c.outcome === "Voicemail" ? Voicemail : PhoneMissed;
          return (
            <motion.li key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} className="flex items-start gap-3 rounded-xl border border-app-line bg-app-panel px-4 py-3.5">
              <Avatar name={person?.name ?? "?"} size={32} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  {person ? (
                    <Link href={`/app/people/${person.id}`} className="font-semibold text-white hover:underline">{person.name}</Link>
                  ) : (
                    <span className="font-semibold text-white">Unknown</span>
                  )}
                  <Badge dark tone={c.outcome === "Connected" ? "green" : c.outcome === "Voicemail" ? "amber" : "neutral"}>
                    <Icon aria-hidden className="size-3" /> {c.outcome}
                  </Badge>
                </p>
                <p className="mt-1 text-[13px] text-app-dim">{c.summary}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-app-mute">
                <p>{formatDate(c.at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                <p className="tabular">{c.durationMin} min</p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
