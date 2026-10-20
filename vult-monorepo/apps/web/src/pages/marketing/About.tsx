import { GlowCTA, Reveal, RevealGroup, RevealItem, SectionIntro } from "@/components/marketing/Section";
import { Avatar } from "@/components/ui/Avatar";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const VALUES = [
  ["Craft over volume", "We ship fewer things, finished. Every screen should feel considered."],
  ["Customers in the room", "Product decisions start with a real team’s real workflow."],
  ["Trust is the product", "Agents act on your data, so control and transparency come first."],
  ["Move with care", "Fast is good. Fast and reversible is better."],
];

const TEAM = ["Lena Hartmann", "Arjun Mehta", "Sofia Delgado", "Noah Fischer", "Yuki Morita", "Kwame Asante", "Clara Jansen", "Omar Haddad"];

export default function AboutPage() {
  useDocumentTitle("About");
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="rail px-[clamp(20px,5vw,60px)] pb-14 pt-[clamp(64px,9vw,112px)]">
          <SectionIntro eyebrow="About" lead="We’re building the CRM we always wanted." rest="One that keeps itself current, models your business as it really is, and lets software handle the busywork." />
        </div>
        <RevealGroup className="rail grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[["2024", "Founded"], ["64", "People"], ["14", "Countries"], ["Series A", "Funding stage"]].map(([v, l]) => (
            <RevealItem key={l} className="bg-white px-8 py-7">
              <p className="text-[36px] font-[550] leading-none tracking-[-0.045em]">{v}</p>
              <p className="mt-1.5 text-sm text-ink-2">{l}</p>
            </RevealItem>
          ))}
        </RevealGroup>
        <p className="rail px-[clamp(20px,5vw,60px)] py-3 text-xs text-subtle">Company figures are placeholders.</p>
      </section>
      <section className="border-b border-line bg-soft">
        <div className="rail grid gap-10 px-[clamp(20px,5vw,60px)] py-[clamp(56px,8vw,96px)] md:grid-cols-2">
          <Reveal>
            <h2 className="text-[clamp(28px,3.4vw,40px)] font-medium leading-[1.12] tracking-[-0.035em]">
              What we believe<span className="text-subtle">.</span>
            </h2>
          </Reveal>
          <RevealGroup className="flex flex-col gap-6">
            {VALUES.map(([t, d]) => (
              <RevealItem key={t} className="border-t border-line pt-5">
                <h3 className="text-lg font-semibold tracking-[-0.02em]">{t}</h3>
                <p className="mt-1 text-ink-2">{d}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      <section className="border-b border-line bg-white">
        <div className="rail px-[clamp(20px,5vw,60px)] py-[clamp(56px,8vw,96px)]">
          <SectionIntro lead="The team." rest="Engineers, designers and former sales leaders from four continents." />
          <RevealGroup className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {TEAM.map((n) => (
              <RevealItem key={n} className="flex flex-col items-start gap-3">
                <Avatar name={n} size={56} />
                <span className="text-sm font-semibold">{n}</span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      <GlowCTA title="Come build with us." primary="Start for free" secondary={null} />
    </>
  );
}
