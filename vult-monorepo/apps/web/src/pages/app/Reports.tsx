import { motion } from "framer-motion";
import { BarChart3, LayoutDashboard, Plus, Star } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { store, uid, useDB } from "@/data/store";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  usePage({ title: "Reports", icon: BarChart3 });
  const db = useDB();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const favorites = db.dashboards.filter((d) => d.favorite);

  const create = () => {
    if (!name.trim()) return setError("Name the dashboard.");
    const id = uid("db");
    store.create("dashboards", { id, name: name.trim(), description: "Sales metrics", favorite: false, reports: ["Pipeline by stage", "Closed-won by month", "Win rate by owner", "Deals by source"], createdAt: new Date().toISOString() });
    store.tick("report");
    setOpen(false);
    setName("");
    navigate(`/app/reports/${id}`);
  };

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="flex items-center justify-end border-b border-app-line px-4 py-2">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> New dashboard
        </Button>
      </div>
      <div className="mx-auto flex max-w-[1080px] flex-col gap-6 p-4 sm:p-6">
        <section aria-labelledby="fav-h">
          <h2 id="fav-h" className="mb-2.5 text-[12.5px] font-semibold text-app-dim">
            Favorites
          </h2>
          {favorites.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}>
                  <Link href={`/app/reports/${d.id}`} onClick={() => store.tick("report")} className="group flex flex-col gap-3 rounded-xl border border-app-line bg-app-panel p-4 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#34363c]">
                    <span aria-hidden className="flex h-20 items-end gap-1.5 rounded-lg bg-[#0f1011] p-3">
                      {[40, 64, 52, 78, 60, 92].map((h, j) => (
                        <span key={j} className="flex-1 origin-bottom rounded-t-sm bg-app-accent/80 transition-transform duration-500 group-hover:scale-y-110" style={{ height: `${h}%` }} />
                      ))}
                    </span>
                    <span className="flex items-center gap-2 font-semibold text-white">
                      {d.name} <Star aria-label="Favorite" className="ml-auto size-3.5 fill-[#f6b67a] text-[#f6b67a]" />
                    </span>
                    <span className="text-xs text-app-mute">{d.reports.length} reports</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[#2d2e30] px-4 py-10 text-center text-app-mute">Dashboards you favorite appear here.</p>
          )}
        </section>
        <section aria-labelledby="all-h">
          <h2 id="all-h" className="mb-2.5 text-[12.5px] font-semibold text-app-dim">
            All dashboards
          </h2>
          <div className="overflow-x-auto rounded-xl border border-app-line">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead>
                <tr className="text-left text-app-mute">
                  <th scope="col" className="border-b border-app-line px-4 py-2.5 font-medium">
                    Dashboard
                  </th>
                  <th scope="col" className="border-b border-app-line px-4 py-2.5 font-medium">
                    Reports
                  </th>
                  <th scope="col" className="border-b border-app-line px-4 py-2.5 font-medium">
                    Created
                  </th>
                  <th scope="col" className="w-12 border-b border-app-line px-4 py-2.5">
                    <span className="sr-only">Favorite</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {db.dashboards.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-[#151618]">
                    <td className="border-b border-app-line-soft px-4 py-3">
                      <Link href={`/app/reports/${d.id}`} className="inline-flex items-center gap-2 font-[550] text-white hover:underline">
                        <LayoutDashboard aria-hidden className="size-4 text-app-dim" /> {d.name}
                      </Link>
                    </td>
                    <td className="border-b border-app-line-soft px-4 py-3 text-app-dim">{d.reports.join(", ")}</td>
                    <td className="border-b border-app-line-soft px-4 py-3 text-app-mute">{formatDate(d.createdAt)}</td>
                    <td className="border-b border-app-line-soft px-4 py-3">
                      <button type="button" aria-pressed={d.favorite} aria-label={`${d.favorite ? "Unfavorite" : "Favorite"} ${d.name}`} onClick={() => store.update("dashboards", d.id, { favorite: !d.favorite })} className="inline-flex size-7 items-center justify-center rounded-md hover:bg-app-hover">
                        <Star className={cn("size-3.5 transition-transform active:scale-125", d.favorite ? "fill-[#f6b67a] text-[#f6b67a]" : "text-app-mute")} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="New dashboard"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create}>Create</Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <Field label="Name" error={error}>
            {(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Q4 board review" />}
          </Field>
        </form>
      </Modal>
    </div>
  );
}
