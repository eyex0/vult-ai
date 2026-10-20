import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <section className="hatch px-[clamp(12px,7vw,120px)] pt-24">
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 bg-white px-6 py-24 text-center">
        <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="text-[clamp(72px,14vw,140px)] font-semibold leading-none tracking-[-0.06em] text-ink">
          404
        </motion.p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">This page wandered off.</h1>
        <p className="max-w-[420px] text-ink-2">The link might be broken, or the page may have moved. Let’s get you back on track.</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button href="/" size="lg" arrow>Back to home</Button>
          <Button href="/contact" variant="secondary" size="lg">Contact support</Button>
        </div>
      </div>
    </section>
  );
}
