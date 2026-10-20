import { useReducedMotion } from "framer-motion";
import { BarChart3, Share2, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Redirect, useParams } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { axisProps, ChartCard, ChartTooltip, VIZ } from "@/components/charts/ChartCard";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { OPEN_STAGES, pipelineTotals } from "@/data/selectors";
import { store, useDB } from "@/data/store";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Range = "90d" | "12m";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const dash = db.dashboards.find((d) => d.id === id);
  usePage({ title: dash?.name ?? "Dashboard", icon: BarChart3, parent: { label: "Reports", href: "/app/reports" } });
  const [range, setRange] = useState<Range>("12m");
  const animate = !useReducedMotion();

  const data = useMemo(() => {
    const now = new Date();
    const months = range === "12m" ? 12 : 3;
    const byMonth = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleDateString("en-US", { month: "short" }), value: 0 };
    });
    // Demo history: a deterministic baseline per month plus the actual won deals in the store.
    byMonth.forEach((m, i) => (m.value = 60000 + ((i * 37) % 11) * 9000 + i * 4000));
    db.deals
      .filter((d) => d.stage === "Won")
      .forEach((d) => {
        const c = new Date(d.closeDate);
        const m = byMonth.find((x) => x.key === `${c.getFullYear()}-${c.getMonth()}`);
        if (m) m.value += d.value;
      });

    const stages = OPEN_STAGES.map((s) => {
      const ds = db.deals.filter((d) => d.stage === s);
      return { stage: s, value: ds.reduce((a, d) => a + d.value, 0), count: ds.length };
    });

    const owners = db.members
      .filter((m) => m.role !== "Guest")
      .map((m) => {
        const won = db.deals.filter((d) => d.ownerId === m.id && d.stage === "Won").length;
        const lost = db.deals.filter((d) => d.ownerId === m.id && d.stage === "Lost").length;
        return { owner: m.name.split(" ")[0]!, rate: won + lost ? Math.round((won / (won + lost)) * 100) : 0, closed: won + lost };
      })
      .filter((o) => o.closed > 0)
      .sort((a, b) => b.rate - a.rate);

    const sources = (["Inbound", "Outbound", "Referral", "Partner", "Event"] as const)
      .map((s) => ({ source: s, value: db.deals.filter((d) => d.source === s && d.stage !== "Lost").reduce((a, d) => a + d.value, 0) }))
      .sort((a, b) => b.value - a.value);

    return { byMonth, stages, owners, sources };
  }, [db, range]);

  if (!dash) return <Redirect to="/app/reports" />;
  const totals = pipelineTotals(db);
  const wonInRange = data.byMonth.reduce((a, m) => a + m.value, 0);

  const kpis = [
    { label: `Closed won (${range === "12m" ? "12 months" : "90 days"})`, value: formatMoney(wonInRange) },
    { label: "Open pipeline", value: formatMoney(totals.openValue) },
    { label: "Win rate", value: `${Math.round(totals.winRate * 100)}%` },
    { label: "Open deals", value: String(totals.openCount) },
  ];

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2 border-b border-app-line px-4 py-2">
        <p className="text-[13px] text-app-mute">{dash.description}</p>
        <span className="ml-auto" />
        <Tabs
          value={range}
          onValueChange={(v) => setRange(v as Range)}
          variant="pill"
          items={[
            { value: "90d", label: "Last 90 days" },
            { value: "12m", label: "Last 12 months" },
          ]}
        />
        <Button variant="ghost" size="sm" aria-pressed={dash.favorite} onClick={() => store.update("dashboards", dash.id, { favorite: !dash.favorite })} className="border border-[#2e3033] text-app-dim">
          <Star className={cn("size-3.5", dash.favorite && "fill-[#f6b67a] text-[#f6b67a]")} /> {dash.favorite ? "Favorited" : "Favorite"}
        </Button>
        <Button
          variant="accent"
          size="sm"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            toast.success("Link copied");
          }}
        >
          <Share2 className="size-3.5" /> Share
        </Button>
      </div>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-app-line bg-app-panel px-4 py-3.5">
              <p className="text-[12.5px] text-app-dim">{k.label}</p>
              <p className="tabular mt-1 text-[22px] font-semibold tracking-[-0.03em] text-white">{k.value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            index={0}
            title="Closed won by month"
            subtitle="USD"
            rows={data.byMonth.map(({ month, value }) => ({ month, value }))}
            columns={[
              { key: "month", label: "Month" },
              { key: "value", label: "Closed won", align: "right", format: (v) => formatMoney(Number(v)) },
            ]}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.byMonth} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="won-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={VIZ.series} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={VIZ.series} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={VIZ.grid} vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} width={52} tickFormatter={(v) => formatCompactMoney(v)} />
                <Tooltip cursor={{ stroke: VIZ.axis, strokeDasharray: "3 3" }} content={(p) => <ChartTooltip {...(p as object)} format={formatMoney} />} />
                <Area type="monotone" dataKey="value" stroke={VIZ.series} strokeWidth={2} fill="url(#won-fill)" activeDot={{ r: 5, stroke: VIZ.surface, strokeWidth: 2 }} isAnimationActive={animate} animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            index={1}
            title="Open pipeline by stage"
            subtitle="Total deal value per stage"
            rows={data.stages}
            columns={[
              { key: "stage", label: "Stage" },
              { key: "count", label: "Deals", align: "right" },
              { key: "value", label: "Value", align: "right", format: (v) => formatMoney(Number(v)) },
            ]}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stages} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
                <CartesianGrid stroke={VIZ.grid} vertical={false} />
                <XAxis dataKey="stage" {...axisProps} />
                <YAxis {...axisProps} width={52} tickFormatter={(v) => formatCompactMoney(v)} />
                <Tooltip cursor={{ fill: "rgb(255 255 255 / 0.04)" }} content={(p) => <ChartTooltip {...(p as object)} format={formatMoney} />} />
                <Bar dataKey="value" fill={VIZ.series} radius={[4, 4, 0, 0]} isAnimationActive={animate} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            index={2}
            title="Win rate by owner"
            subtitle="Won ÷ (won + lost), all time"
            rows={data.owners}
            columns={[
              { key: "owner", label: "Owner" },
              { key: "closed", label: "Closed deals", align: "right" },
              { key: "rate", label: "Win rate", align: "right", format: (v) => `${v}%` },
            ]}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.owners} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 4 }} barCategoryGap="30%">
                <CartesianGrid stroke={VIZ.grid} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} {...axisProps} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="owner" {...axisProps} width={56} />
                <Tooltip cursor={{ fill: "rgb(255 255 255 / 0.04)" }} content={(p) => <ChartTooltip {...(p as object)} format={(v) => `${v}%`} />} />
                <Bar dataKey="rate" fill={VIZ.series} radius={[0, 4, 4, 0]} isAnimationActive={animate} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            index={3}
            title="Pipeline by source"
            subtitle="Open and won deal value"
            rows={data.sources}
            columns={[
              { key: "source", label: "Source" },
              { key: "value", label: "Value", align: "right", format: (v) => formatMoney(Number(v)) },
            ]}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sources} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 4 }} barCategoryGap="30%">
                <CartesianGrid stroke={VIZ.grid} horizontal={false} />
                <XAxis type="number" {...axisProps} tickFormatter={(v) => formatCompactMoney(v)} />
                <YAxis type="category" dataKey="source" {...axisProps} width={68} />
                <Tooltip cursor={{ fill: "rgb(255 255 255 / 0.04)" }} content={(p) => <ChartTooltip {...(p as object)} format={formatMoney} />} />
                <Bar dataKey="value" fill={VIZ.series} radius={[0, 4, 4, 0]} isAnimationActive={animate} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <p className="text-xs text-app-mute">Demo data. Monthly history includes a generated baseline plus deals marked Won in this workspace.</p>
      </div>
    </div>
  );
}
