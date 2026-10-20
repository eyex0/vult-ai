import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Logo } from "@/components/brand/Logo";
import { ThemeScope } from "@/components/ui/ThemeScope";
import { FOOTER_COLUMNS } from "@/content/nav";
import { readJSON, writeJSON } from "@/lib/storage";
import { Header } from "./Header";

function AnnouncementBar() {
  const [show, setShow] = useState(() => !readJSON("announce.agents", false));
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 40 }}
          exit={{ height: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden bg-night text-[13px] text-white"
        >
          <div className="flex h-10 items-center justify-center px-12">
            <Link href="/platform/agents" className="group inline-flex items-center gap-2 font-medium text-white hover:text-white">
              <span className="rounded-full bg-accent px-2 py-px text-[11px] font-semibold">New</span>
              Introducing Vult Agents
              <ArrowRight aria-hidden className="size-3.5 transition-transform duration-150 group-hover:translate-x-[3px]" />
            </Link>
          </div>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => {
              setShow(false);
              writeJSON("announce.agents", true);
            }}
            className="absolute right-1.5 top-0.5 inline-flex size-9 items-center justify-center rounded-btn text-[#a3a6b0] transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SOCIAL = [
  {
    label: "Vult on X",
    path: "M4 4l16 16M20 4L4 20",
  },
  {
    label: "Vult on LinkedIn",
    path: "M3 3h18v18H3zM8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7",
  },
  {
    label: "Vult on YouTube",
    path: "M2 7a4 4 0 0 1 4-2h12a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zM10 9l5 3-5 3z",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-night-line bg-night text-[#c9cbd2]">
      <div className="rail-dark px-[clamp(20px,5vw,60px)] pb-8 pt-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-9 sm:grid-cols-3 lg:grid-cols-[2fr_repeat(5,1fr)]">
          <div className="col-span-2 flex max-w-[280px] flex-col gap-3 sm:col-span-3 lg:col-span-1">
            <Logo tone="light" />
            <p className="text-sm text-[#8a8d96]">The AI-native CRM for teams that move fast.</p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2.5 text-sm">
              <span className="text-[#8a8d96]">{col.title}</span>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} className="w-fit text-[#d9dbe1] transition-colors hover:text-white">
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-night-line pt-6 text-[13px] text-[#8a8d96]">
          <span>© 2026 Vult, Inc.</span>
          <span className="flex gap-1">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="inline-flex size-9 items-center justify-center rounded-btn text-[#a9acb6] transition-colors hover:bg-white/5 hover:text-white"
              >
                <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </span>
          <a href="#" className="inline-flex items-center gap-2 text-[#c9cbd2] hover:text-white">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#2bb673] opacity-60" />
              <span className="relative size-2 rounded-full bg-[#2bb673]" />
            </span>
            All systems operational
          </a>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeScope theme="light">
      <div className="min-h-screen overflow-x-clip bg-soft">
        <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-[100] rounded-btn bg-ink px-3 py-2 text-sm text-white">
          Skip to content
        </a>
        <AnnouncementBar />
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </div>
    </ThemeScope>
  );
}
