import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { signIn } from "@/lib/session";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285F4" />
      <path d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853" />
      <path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z" fill="#FBBC05" />
      <path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path d="M2 2h9.5v9.5H2z" fill="#F25022" />
      <path d="M12.5 2H22v9.5h-9.5z" fill="#7FBA00" />
      <path d="M2 12.5h9.5V22H2z" fill="#00A4EF" />
      <path d="M12.5 12.5H22V22h-9.5z" fill="#FFB900" />
    </svg>
  );
}

function AuthCard({ mode }: { mode: "signin" | "signup" }) {
  const signup = mode === "signup";
  useDocumentTitle(signup ? "Create your account" : "Sign in");
  const [, navigate] = useLocation();
  const search = useSearch();
  const next = new URLSearchParams(search).get("next");
  const dest = next && next.startsWith("/app") ? next : "/app/home";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [pending, setPending] = useState(false);

  const finish = (address: string, fullName?: string) => {
    setPending(true);
    signIn(address, fullName);
    // Short delay so the button state is visible; there is no real auth backend.
    setTimeout(() => navigate(dest), 350);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (signup && !name.trim()) next.name = "Enter your name.";
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid work email.";
    setErrors(next);
    if (Object.keys(next).length === 0) finish(email.trim(), name);
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-soft px-4 py-6 [background-image:repeating-linear-gradient(90deg,rgb(59_91_253/0.1)_0_1px,transparent_1px_7px)]">
      <div className="mt-8">
        <Logo size={30} />
      </div>
      <motion.main
        id="main"
        className="mt-10 w-full max-w-[420px] rounded-panel border border-line bg-white px-8 pb-7 pt-9 shadow-pop max-[420px]:px-5"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <h1 className="text-center text-[26px] font-semibold tracking-[-0.035em]">{signup ? "Create your workspace" : "Welcome back"}</h1>
        <p className="mb-7 mt-1.5 text-center text-[14.5px] text-subtle">
          {signup ? "Free for up to 3 seats. No credit card." : "Sign in to your Vult workspace."}
        </p>
        <div className="flex flex-col gap-2.5">
          <Button variant="secondary" size="lg" onClick={() => finish("dani@ridgeway.example", "Dani Rossi")} disabled={pending}>
            <GoogleIcon /> Continue with Google
          </Button>
          <Button variant="secondary" size="lg" onClick={() => finish("dani@ridgeway.example", "Dani Rossi")} disabled={pending}>
            <MicrosoftIcon /> Continue with Microsoft
          </Button>
        </div>
        <div aria-hidden className="my-[22px] flex items-center gap-3 text-[12.5px] text-subtle">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
          {signup && (
            <Field label="Full name" error={errors.name}>
              {(p) => <Input {...p} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dani Rossi" className="h-11" />}
            </Field>
          )}
          <Field label="Work email" error={errors.email}>
            {(p) => (
              <Input
                {...p}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="you@company.com"
                className="h-11"
              />
            )}
          </Field>
          <Button type="submit" size="lg" disabled={pending} className="mt-1">
            {pending ? "Opening your workspace…" : signup ? "Create account" : "Continue with email"}
          </Button>
        </form>
        <p className="mt-[22px] text-center text-sm text-ink-2">
          {signup ? "Already have an account? " : "New to Vult? "}
          <Link href={signup ? "/signin" : "/signup"} className="font-[550] text-accent hover:underline">
            {signup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </motion.main>
      <p className="mt-6 max-w-[360px] text-center text-[12.5px] text-subtle">
        By continuing you agree to the{" "}
        <Link href="/legal/terms" className="text-accent hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="text-accent hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

export function SignInPage() {
  return <AuthCard mode="signin" />;
}

export function SignUpPage() {
  return <AuthCard mode="signup" />;
}
