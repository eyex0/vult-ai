import {
  ArrowLeftRight, BarChart3, Building2, CheckSquare, CircleDollarSign, FileText, Home, Inbox, Mail, Phone, Send, Users, Workflow, type LucideIcon,
} from "lucide-react";

export const APP_NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Home", href: "/app/home", icon: Home },
  { label: "Inbox", href: "/app/inbox", icon: Inbox },
  { label: "Tasks", href: "/app/tasks", icon: CheckSquare },
  { label: "Notes", href: "/app/notes", icon: FileText },
  { label: "Emails", href: "/app/emails", icon: Mail },
  { label: "Calls", href: "/app/calls", icon: Phone },
  { label: "Match", href: "/app/match", icon: ArrowLeftRight },
  { label: "Reports", href: "/app/reports", icon: BarChart3 },
  { label: "Sequences", href: "/app/sequences", icon: Send },
  { label: "Workflows", href: "/app/workflows", icon: Workflow },
];

/** Pages that run on the workspace's real data; in production builds the sidebar shows only these. */
export const LIVE_PAGES = new Set(["/app/match"]);

export const RECORD_NAV: { label: string; href: string; icon: LucideIcon; color: string }[] = [
  { label: "Companies", href: "/app/companies", icon: Building2, color: "#6f87ff" },
  { label: "People", href: "/app/people", icon: Users, color: "#3ddc84" },
  { label: "Deals", href: "/app/deals", icon: CircleDollarSign, color: "#f2994a" },
];
