import {
  BarChart3, BookOpen, Bot, Boxes, Code2, FileClock, GraduationCap, Handshake, LifeBuoy, MessageSquare, Newspaper, Plug, Rocket, Send,
  Layers, Sparkles, Users2, Workflow, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const PLATFORM_NAV: NavItem[] = [
  { title: "Data model", desc: "Custom objects, fields and relationships", href: "/platform/data-model", icon: Boxes },
  { title: "Agents", desc: "AI teammates for research and follow-up", href: "/platform/agents", icon: Bot },
  { title: "Automations", desc: "Visual workflows on any record change", href: "/platform/automations", icon: Workflow },
  { title: "Reporting", desc: "Live dashboards and plain-language questions", href: "/platform/reporting", icon: BarChart3 },
  { title: "Enrichment", desc: "Company and contact data that stays fresh", href: "/platform/enrichment", icon: Sparkles },
];

export const PLATFORM_GROUPS: NavGroup[] = [
  { title: "Context", items: [PLATFORM_NAV[0]!, PLATFORM_NAV[4]!, PLATFORM_NAV[3]!] },
  {
    title: "Orchestration",
    items: [
      PLATFORM_NAV[1]!,
      PLATFORM_NAV[2]!,
      { title: "Sequences", desc: "Multi-step outreach that stops on reply", href: "/platform/automations", icon: Send },
    ],
  },
  {
    title: "Ecosystem",
    items: [
      { title: "Integrations", desc: "Inbox, calendar, chat and billing", href: "/platform/automations", icon: Plug },
      { title: "Architecture", desc: "How Vult turns invoices into revenue", href: "/architecture", icon: Layers },
      { title: "Developer platform", desc: "REST API, webhooks and SDKs", href: "/about", icon: Code2 },
      { title: "Ask Vult", desc: "Answers from your workspace", href: "/platform/reporting", icon: MessageSquare },
    ],
  },
];

export const RESOURCES_GROUPS: NavGroup[] = [
  {
    title: "Support",
    items: [
      { title: "Help center", desc: "Answers to common questions", href: "/contact", icon: LifeBuoy },
      { title: "Academy", desc: "Courses for admins and reps", href: "/about", icon: GraduationCap },
      { title: "Documentation", desc: "Guides and API reference", href: "/about", icon: BookOpen },
    ],
  },
  {
    title: "Company",
    items: [
      { title: "Customers", desc: "How teams run on Vult", href: "/customers", icon: Users2 },
      { title: "Changelog", desc: "What shipped this week", href: "/changelog", icon: FileClock },
      { title: "Careers", desc: "Build the CRM teams love", href: "/careers", icon: Newspaper },
    ],
  },
  {
    title: "Get started",
    items: [
      { title: "Startup program", desc: "50% off for your first year", href: "/pricing", icon: Rocket },
      { title: "Partners", desc: "Implementation and tech partners", href: "/contact", icon: Handshake },
    ],
  },
];

/** Flat list kept for the mobile drawer. */
export const RESOURCES_NAV: NavItem[] = RESOURCES_GROUPS.flatMap((g) => g.items);

export const FOOTER_COLUMNS: { title: string; links: [string, string][] }[] = [
  { title: "Platform", links: [...PLATFORM_NAV.map((n) => [n.title, n.href] as [string, string]), ["Pricing", "/pricing"]] },
  { title: "Company", links: [["About", "/about"], ["Architecture", "/architecture"], ["Customers", "/customers"], ["Changelog", "/changelog"], ["Careers", "/careers"]] },
  { title: "Resources", links: [["Help center", "/contact"], ["Documentation", "/about"], ["Contact sales", "/contact"], ["Sign in", "/signin"]] },
  { title: "Legal", links: [["Privacy", "/legal/privacy"], ["Terms", "/legal/terms"]] },
];
