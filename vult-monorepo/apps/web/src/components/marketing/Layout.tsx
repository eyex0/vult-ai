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
          animate={{ height: 48 }}
          exit={{ height: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden bg-black text-[14px] text-white"
        >
          <div className="flex h-12 items-center justify-center px-12">
            <Link href="/platform/agents" className="group inline-flex items-center gap-1.5 font-medium text-white">
              Vult Agents are here — hand off the busywork
              <ArrowRight aria-hidden className="size-3.5 transition-transform duration-150 group-hover:translate-x-[3px]" />
            </Link>
          </div>
          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={() => {
              setShow(false);
              writeJSON("announce.agents", true);
            }}
            className="absolute right-3 top-1.5 inline-flex size-9 items-center justify-center rounded-[10px] text-[#a3a6b0] transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SOCIAL = [
  { label: "Vult on LinkedIn", path: "M4 4h16v16H4zM8 10v6M8 7.5v.01M12 16v-3.5a2 2 0 0 1 4 0V16M12 10v6" },
  { label: "Vult on X", path: "M5 5l14 14M19 5L5 19" },
  { label: "Vult on YouTube", path: "M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM10 9l5 3-5 3z" },
];

export function Footer() {
  return (
    <footer className="bg-night text-[#c9cbd2]">
      <div className="rail-dark px-6 pb-8 pt-16 lg:px-10">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-3">
            <Logo tone="light" />
            <p className="max-w-[240px] text-[13px] text-[#8a8d96]">The AI-native CRM for teams that move fast.</p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2 text-[13px]">
              <span className="mb-1 text-[#8a8d96]">{col.title}</span>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} className="w-fit text-[#d9dbe1] transition-colors hover:text-white">
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 text-[12px] text-[#8a8d96]">
          <span className="flex gap-1">
            {SOCIAL.map((s) => (
              <a key={s.label} href="#" aria-label={s.label} className="inline-flex size-8 items-center justify-center rounded-lg text-[#a9acb6] transition-colors hover:bg-white/5 hover:text-white">
                <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </span>
          <span className="flex flex-wrap items-center gap-5">
            <span>© 2026 Vult, Inc. All rights reserved.</span>
            <Link href="/legal/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-white">
              Privacy
            </Link>
            <span className="inline-flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#2bb673] opacity-60" />
                <span className="relative size-2 rounded-full bg-[#2bb673]" />
              </span>
              All systems operational
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeScope theme="light">
      <div className="site min-h-screen overflow-x-clip bg-white text-ink">
        <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-[100] rounded-[10px] bg-ink px-3 py-2 text-sm text-white">
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
