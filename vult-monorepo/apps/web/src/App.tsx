import { MotionConfig } from "framer-motion";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { MarketingLayout } from "@/components/marketing/Layout";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { SignInPage, SignUpPage } from "@/pages/auth/Auth";
import HomePage from "@/pages/marketing/Home";

// Marketing (Home is eager for first paint; the rest load on demand)
const PlatformPage = lazy(() => import("@/pages/marketing/Platform"));
const PricingPage = lazy(() => import("@/pages/marketing/Pricing"));
const CustomersPage = lazy(() => import("@/pages/marketing/Customers"));
const ChangelogPage = lazy(() => import("@/pages/marketing/Changelog"));
const AboutPage = lazy(() => import("@/pages/marketing/About"));
const CareersPage = lazy(() => import("@/pages/marketing/Careers"));
const ContactPage = lazy(() => import("@/pages/marketing/Contact"));
const LegalPage = lazy(() => import("@/pages/marketing/Legal"));
const NotFoundPage = lazy(() => import("@/pages/marketing/NotFound"));
const AppRoutes = lazy(() => import("@/pages/app/AppRoutes"));

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Fallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true">
      <span className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent text-muted" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

function Marketing({ children }: { children: ReactNode }) {
  return (
    <MarketingLayout>
      <Suspense fallback={<Fallback />}>{children}</Suspense>
    </MarketingLayout>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={250}>
        <ScrollToTop />
        <Switch>
          <Route path="/signin" component={SignInPage} />
          <Route path="/signup" component={SignUpPage} />
          <Route path="/app">
            <Redirect to="/app/home" />
          </Route>
          <Route path="/app/*">
            <Suspense fallback={<div className="h-dvh bg-app" />}>
              <AppRoutes />
            </Suspense>
          </Route>
          <Route path="/">
            <MarketingLayout>
              <HomePage />
            </MarketingLayout>
          </Route>
          <Route path="/platform/:slug">{(p) => <Marketing><PlatformPage slug={p.slug} /></Marketing>}</Route>
          <Route path="/pricing">{() => <Marketing><PricingPage /></Marketing>}</Route>
          <Route path="/customers">{() => <Marketing><CustomersPage /></Marketing>}</Route>
          <Route path="/changelog">{() => <Marketing><ChangelogPage /></Marketing>}</Route>
          <Route path="/about">{() => <Marketing><AboutPage /></Marketing>}</Route>
          <Route path="/careers">{() => <Marketing><CareersPage /></Marketing>}</Route>
          <Route path="/contact">{() => <Marketing><ContactPage /></Marketing>}</Route>
          <Route path="/legal/:doc">{(p) => <Marketing><LegalPage doc={p.doc} /></Marketing>}</Route>
          <Route>{() => <Marketing><NotFoundPage /></Marketing>}</Route>
        </Switch>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "!rounded-xl !border !border-[#2e3033] !bg-[#17181a] !text-[#e9eaee] !font-sans",
          }}
        />
      </TooltipProvider>
    </MotionConfig>
  );
}
