import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Badge";
import { EASE, fadeUp, inView, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Fades and slides children in once they scroll into view. */
export function Reveal({ className, delay = 0, ...rest }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      {...inView}
      variants={{ hidden: fadeUp.hidden, show: { ...(fadeUp.show as object), transition: { duration: 0.42, ease: EASE.outCubic, delay } } }}
      className={className}
      {...rest}
    />
  );
}

/** Staggers direct <RevealItem> children. */
export function RevealGroup({ className, step = 0.07, ...rest }: HTMLMotionProps<"div"> & { step?: number }) {
  return <motion.div {...inView} variants={stagger(step)} className={className} {...rest} />;
}

export function RevealItem({ className, ...rest }: HTMLMotionProps<"div">) {
  return <motion.div variants={fadeUp} className={className} {...rest} />;
}

/** Headline in two tones: a dark lead sentence, then a gray continuation (Inter Display, medium). */
export function TwoTone({
  lead,
  rest,
  as: Tag = "h2",
  dark,
  className,
}: {
  lead: ReactNode;
  rest?: ReactNode;
  as?: "h1" | "h2" | "h3";
  dark?: boolean;
  className?: string;
}) {
  return (
    <Tag className={cn("display text-balance font-medium tracking-[-0.01em]", className)}>
      <span className={dark ? "text-white" : "text-ink"}>{lead}</span>{" "}
      {rest && <span className={dark ? "text-[#8a8f9a]" : "text-tone"}>{rest}</span>}
    </Tag>
  );
}

export function SectionIntro({
  eyebrow,
  lead,
  rest,
  dark,
  center,
  className,
}: {
  eyebrow?: string;
  lead: ReactNode;
  rest?: ReactNode;
  dark?: boolean;
  center?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={cn("flex flex-col gap-5", center && "items-center text-center", className)}>
      {eyebrow && <Eyebrow dark={dark} className={center ? undefined : "self-start"}>{eyebrow}</Eyebrow>}
      <TwoTone lead={lead} rest={rest} dark={dark} className={cn("max-w-[900px] text-[clamp(30px,3.2vw,40px)] leading-[1.1]", center && "mx-auto")} />
    </Reveal>
  );
}

export function FAQ({ items, title = "Questions,", subtitle = "answered." }: { items: { q: string; a: string }[]; title?: string; subtitle?: string }) {
  const [open, setOpen] = useState(0);
  const id = useId();
  return (
    <section className="border-b border-line bg-white">
      <div className="rail grid gap-10 px-[clamp(20px,5vw,60px)] py-[clamp(56px,8vw,96px)] md:grid-cols-2">
        <Reveal>
          <h2 className="display text-[clamp(28px,3.2vw,40px)] font-medium leading-[1.1] tracking-[-0.01em]">
            <span className="text-ink">{title}</span>
            <br />
            <span className="text-tone">{subtitle}</span>
          </h2>
        </Reveal>
        <div className="border-t border-line">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b border-line">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex min-h-[60px] w-full items-center justify-between gap-4 py-3 text-left text-base font-medium text-ink transition-colors hover:text-accent"
                  >
                    {f.q}
                    {isOpen ? <Minus aria-hidden className="size-4 shrink-0 text-subtle" /> : <Plus aria-hidden className="size-4 shrink-0 text-subtle" />}
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`${id}-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[560px] pb-5 text-ink-2">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function GlowCTA({ title, primary = "Start for free", secondary = "Talk to sales" }: { title: ReactNode; primary?: string; secondary?: string | null }) {
  return (
    <section className="relative overflow-hidden bg-night text-white">
      <div aria-hidden className="vlines-dark absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,#000_40%,#000_70%,transparent)]" />
      <motion.div
        aria-hidden
        className="absolute bottom-[-340px] left-1/2 h-[560px] w-[1100px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgb(38_109_240/0.5),rgb(110_90_255/0.16)_42%,transparent_70%)]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.9, 0.65, 0.9] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <Reveal className="rail-dark relative flex flex-col items-center gap-8 px-6 py-[clamp(96px,12vw,170px)] text-center">
        <h2 className="display text-balance text-[clamp(40px,6vw,72px)] font-semibold leading-[0.98] tracking-[-0.025em]">{title}</h2>
        <div className="flex flex-wrap justify-center gap-2.5">
          {secondary && (
            <Button href="/contact" variant="outline-inverse" size="lg">
              {secondary}
            </Button>
          )}
          <Button href="/signup" variant="inverse" size="lg">
            {primary}
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

/** Light browser-chrome frame around a product mockup. */
export function BrowserFrame({ children, url, className }: { children: ReactNode; url?: string; className?: string }) {
  return (
    <div className={cn("rounded-t-card border border-b-0 border-[#e2e4e9] bg-[#f3f4f6] px-[7px] shadow-[0_-24px_64px_-32px_rgb(16_17_26/0.22)]", className)}>
      <div className="flex h-[34px] items-center gap-3 px-2">
        <span aria-hidden className="flex gap-[7px]">
          <span className="size-[11px] rounded-full bg-[#ff5f57]" />
          <span className="size-[11px] rounded-full bg-[#febc2e]" />
          <span className="size-[11px] rounded-full bg-[#28c840]" />
        </span>
        {url && (
          <span className="mx-auto hidden h-6 max-w-[340px] flex-1 items-center justify-center rounded-[7px] border border-line bg-white text-xs text-subtle sm:flex">
            {url}
          </span>
        )}
        {url && <span className="hidden w-[51px] sm:block" />}
      </div>
      {children}
    </div>
  );
}
