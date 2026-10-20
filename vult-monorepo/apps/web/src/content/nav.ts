import {
  BarChart3, Blocks, BookOpen, Bot, Boxes, FileClock, LifeBuoy, Newspaper, Sparkles, Users2, Workflow, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
}

export const PLATFORM_NAV: NavItem[] = [
  { title: "Data model", desc: "Custom objects, fields and relationships", href: "/platform/data-model", icon: Boxes },
  { title: "Agents", desc: "AI teammates for research and follow-up", href: "/platform/agents", icon: Bot },
  { title: "Automations", desc: "Visual workflows on any record change", href: "/platform/automations", icon: Workflow },
  { title: "Reporting", desc: "Live dashboards and plain-language questions", href: "/platform/reporting", icon: BarChart3 },
  { title: "Enrichment", desc: "Company and contact data that stays fresh", href: "/platform/enrichment", icon: Sparkles },
];

export const RESOURCES_NAV: NavItem[] = [
  { title: "Documentation", desc: "Guides, concepts and API reference", href: "/about", icon: BookOpen },
  { title: "Templates", desc: "Ready-made objects and workflows", href: "/platform/automations", icon: Blocks },
  { title: "Customers", desc: "How teams run on Vult", href: "/customers", icon: Users2 },
  { title: "Help center", desc: "Answers to common questions", href: "/contact", icon: LifeBuoy },
  { title: "Changelog", desc: "What shipped this week", href: "/changelog", icon: FileClock },
  { title: "Careers", desc: "Build the CRM teams love", href: "/careers", icon: Newspaper },
];

export const FOOTER_COLUMNS: { title: string; links: [string, string][] }[] = [
  { title: "Product", links: [["Pricing", "/pricing"], ["Changelog", "/changelog"], ["Customers", "/customers"], ["Sign in", "/signin"]] },
  { title: "Platform", links: PLATFORM_NAV.map((n) => [n.title, n.href]) },
  { title: "Company", links: [["About", "/about"], ["Careers", "/careers"], ["Contact", "/contact"]] },
  { title: "Resources", links: [["Documentation", "/about"], ["Templates", "/platform/automations"], ["Help center", "/contact"]] },
  { title: "Legal", links: [["Privacy", "/legal/privacy"], ["Terms", "/legal/terms"]] },
];
