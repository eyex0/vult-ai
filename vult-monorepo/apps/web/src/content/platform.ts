export type MockKind = "schema" | "agent" | "workflow" | "chart" | "enrich" | "list" | "table" | "chat";

export interface PlatformSection {
  eyebrow: string;
  lead: string;
  rest: string;
  points: string[];
  mock: MockKind;
  mockTitle: string;
  rows: { title: string; detail: string; pill: string; tone: "done" | "wait" | "run" }[];
}

export interface PlatformPageContent {
  slug: string;
  name: string;
  title: [string, string];
  subtitle: string;
  sections: PlatformSection[];
  faqs: { q: string; a: string }[];
  cta: string;
}

export const PLATFORM: Record<string, PlatformPageContent> = {
  "data-model": {
    slug: "data-model",
    name: "Data model",
    title: ["Your business,", "modeled exactly."],
    subtitle: "Create the objects, fields and relationships you actually use — no workarounds, no admin team required.",
    sections: [
      {
        eyebrow: "Custom objects", lead: "Beyond companies and people.", rest: "Model investors, venues, partners or anything else with their own records and views.",
        points: ["Unlimited custom objects on Plus and above", "Typed fields: currency, status, rating, relation", "Templates for common business models"],
        mock: "schema", mockTitle: "Objects", rows: [
          { title: "Company", detail: "14 fields · 30 records", pill: "Standard", tone: "done" },
          { title: "Deal", detail: "11 fields · 25 records", pill: "Standard", tone: "done" },
          { title: "Partner", detail: "6 fields · 12 records", pill: "Custom", tone: "run" },
          { title: "Event", detail: "Draft", pill: "New", tone: "wait" },
        ],
      },
      {
        eyebrow: "Relationships", lead: "Everything connects.", rest: "Link any record to any other with one-to-many and many-to-many relations.",
        points: ["Bi-directional relations", "Roll-up fields across relations", "Relation filters in every view"],
        mock: "list", mockTitle: "Kelvra · related", rows: [
          { title: "12 people", detail: "3 strong connections", pill: "People", tone: "done" },
          { title: "2 open deals", detail: "$102,750 pipeline", pill: "Deals", tone: "run" },
          { title: "1 partner", detail: "Implementation partner", pill: "Partner", tone: "done" },
        ],
      },
      {
        eyebrow: "Views", lead: "Tables, boards and lists.", rest: "Every team sees the data their way, from the same source of truth.",
        points: ["Saved views with filters and sorts", "Kanban boards on any status field", "Private and shared lists"],
        mock: "table", mockTitle: "Q4 target accounts", rows: [
          { title: "Solvane", detail: "Enterprise · Berlin", pill: "Tier 1", tone: "done" },
          { title: "Brightvale", detail: "Mid-market · Dublin", pill: "Tier 1", tone: "done" },
          { title: "Mirakai", detail: "Enterprise · Singapore", pill: "Tier 2", tone: "wait" },
        ],
      },
    ],
    faqs: [
      { q: "Can I import my existing data?", a: "Yes. Import CSV files or connect your previous CRM. Vult maps columns to fields and flags duplicates before anything is written." },
      { q: "Is there a limit on fields?", a: "No practical limit on paid plans. Free workspaces can create up to 3 custom objects." },
      { q: "Can I change a field type later?", a: "Most field types convert safely, and Vult previews the result before applying the change." },
    ],
    cta: "Model your business in minutes.",
  },
  agents: {
    slug: "agents",
    name: "Agents",
    title: ["Agents that know", "your customers."],
    subtitle: "Give an agent a goal and a scope. It reads your CRM, inbox and the web, does the work, and shows you every step.",
    sections: [
      {
        eyebrow: "Research", lead: "Account briefs in minutes.", rest: "Agents pull from your records, emails and public sources, then cite every claim.",
        points: ["Sources linked inline", "Writes back to record fields", "Runs on a schedule or on demand"],
        mock: "agent", mockTitle: "Research · Solvane", rows: [
          { title: "News scan", detail: "EU office opening in Lisbon", pill: "Done", tone: "done" },
          { title: "People changes", detail: "New Head of RevOps", pill: "Done", tone: "done" },
          { title: "Fit score", detail: "ICP 92 · Tier 1", pill: "Done", tone: "done" },
          { title: "Draft email", detail: "Intro to new RevOps lead", pill: "Review", tone: "wait" },
        ],
      },
      {
        eyebrow: "Qualify", lead: "Route the right leads, instantly.", rest: "Every inbound is matched, enriched and scored before a rep sees it.",
        points: ["Custom scoring rubric", "Round-robin or territory routing", "Politely closes poor fits"],
        mock: "list", mockTitle: "Inbound queue", rows: [
          { title: "Brightvale · Ops Director", detail: "Score 88 → Theo Lindqvist", pill: "Routed", tone: "done" },
          { title: "Tessaro · Founder", detail: "Score 64 → nurture", pill: "Routed", tone: "done" },
          { title: "Maplewing · VP Sales", detail: "Scoring…", pill: "Running", tone: "run" },
        ],
      },
      {
        eyebrow: "Control", lead: "You stay in charge.", rest: "Scopes, approvals and a full audit trail for everything an agent touches.",
        points: ["Per-agent permissions", "Approval gates on send and write", "Every run can be replayed"],
        mock: "list", mockTitle: "Run log", rows: [
          { title: "Read 14 records", detail: "Companies · Tier 1", pill: "Allowed", tone: "done" },
          { title: "Updated “Last news”", detail: "3 records", pill: "Allowed", tone: "done" },
          { title: "Send email", detail: "To 2 contacts", pill: "Needs OK", tone: "wait" },
        ],
      },
    ],
    faqs: [
      { q: "Can an agent send emails on its own?", a: "Only if you allow it. By default anything that leaves your workspace waits for a person to approve it." },
      { q: "Which data can agents see?", a: "Exactly what you scope them to — objects, lists and fields — and never more than the person who created them." },
      { q: "How are agents billed?", a: "Agents are included on Pro and Enterprise with a monthly run allowance. You can set a hard cap per agent." },
      { q: "Can I build my own agents?", a: "Yes. Describe the goal in plain language, pick tools and scope, then test it on real records before turning it on." },
    ],
    cta: "Put your first agent to work today.",
  },
  automations: {
    slug: "automations",
    name: "Automations",
    title: ["Workflows that run", "while you sell."],
    subtitle: "Trigger on any change, branch on conditions, call an agent and notify the team — built visually, tested on real records.",
    sections: [
      {
        eyebrow: "Builder", lead: "Visual, not fiddly.", rest: "Drop in triggers, conditions, agents and actions. See exactly what will happen before you publish.",
        points: ["40+ triggers and actions", "Branches and waits", "Test runs on real records"],
        mock: "workflow", mockTitle: "Kick off won deals", rows: [
          { title: "Deal stage changes to Won", detail: "Trigger", pill: "Trigger", tone: "run" },
          { title: "Value is over $50,000", detail: "Condition", pill: "If", tone: "wait" },
          { title: "Draft a kickoff plan", detail: "Agent", pill: "AI", tone: "done" },
          { title: "Notify #wins", detail: "Action", pill: "Notify", tone: "done" },
        ],
      },
      {
        eyebrow: "Sequences", lead: "Follow-up on autopilot.", rest: "Multi-step email, call and task cadences that stop the moment someone replies.",
        points: ["Personalisation variables", "Reply detection", "Per-step analytics"],
        mock: "list", mockTitle: "Inbound follow-up", rows: [
          { title: "Thanks for reaching out", detail: "Day 0 · email", pill: "48 sent", tone: "done" },
          { title: "Quick resources", detail: "Day 2 · email", pill: "41 sent", tone: "done" },
          { title: "Call if no reply", detail: "Day 5 · task", pill: "12 open", tone: "wait" },
        ],
      },
      {
        eyebrow: "Reliability", lead: "Know every run.", rest: "Step-by-step history, retries and alerts when something needs attention.",
        points: ["Run history with inputs and outputs", "Automatic retries", "Version history with rollback"],
        mock: "list", mockTitle: "Recent runs", rows: [
          { title: "Route inbound demo requests", detail: "142 runs · 7 days", pill: "98%", tone: "done" },
          { title: "Kick off won deals", detail: "6 runs · 7 days", pill: "100%", tone: "done" },
          { title: "Stalled deal nudges", detail: "Paused", pill: "Paused", tone: "wait" },
        ],
      },
    ],
    faqs: [
      { q: "Do I need to write code?", a: "No. Everything is built visually. Developers can add webhooks and custom code steps when they need them." },
      { q: "What happens when a step fails?", a: "Vult retries with back-off, then alerts the workflow owner with the exact input that failed." },
      { q: "Can I roll back a change?", a: "Every publish creates a version. Restore any previous version in one click." },
    ],
    cta: "Automate the busywork.",
  },
  reporting: {
    slug: "reporting",
    name: "Reporting",
    title: ["Answers,", "not exports."],
    subtitle: "Ask in plain language or build a chart in a few clicks. Dashboards update the moment a deal moves.",
    sections: [
      {
        eyebrow: "Dashboards", lead: "Live from your records.", rest: "No syncing, no stale spreadsheets — every chart reads the same data your team edits.",
        points: ["Pipeline, velocity and forecast", "Drill into any bar to see the records", "Share links with your team"],
        mock: "chart", mockTitle: "Closed won by month", rows: [],
      },
      {
        eyebrow: "Ask Vult", lead: "Questions in plain language.", rest: "“Which deals are at risk this month?” gets an answer with the records behind it.",
        points: ["Cites the records it used", "Turns answers into saved reports", "Respects permissions"],
        mock: "chat", mockTitle: "Ask Vult", rows: [
          { title: "Which deals are at risk this month?", detail: "You", pill: "Q", tone: "run" },
          { title: "3 deals: EMEA expansion, Seat true-up, Security review", detail: "Vult", pill: "A", tone: "done" },
        ],
      },
      {
        eyebrow: "Forecasting", lead: "Commit with confidence.", rest: "Weighted pipeline by stage and owner, with history so you can see what changed.",
        points: ["Stage-weighted forecast", "Rep and team roll-ups", "Week-over-week changes"],
        mock: "list", mockTitle: "Q4 forecast", rows: [
          { title: "Commit", detail: "$412,000", pill: "+8%", tone: "done" },
          { title: "Best case", detail: "$588,500", pill: "+3%", tone: "done" },
          { title: "Pipeline", detail: "$1.2M", pill: "−2%", tone: "wait" },
        ],
      },
    ],
    faqs: [
      { q: "Can I export data?", a: "Yes — every table and chart exports to CSV, subject to your permissions." },
      { q: "How fresh is the data?", a: "Real time. Charts query the same records your team is editing." },
      { q: "Can I build custom metrics?", a: "Yes. Combine fields with formulas and save them as reusable metrics." },
    ],
    cta: "See your pipeline clearly.",
  },
  enrichment: {
    slug: "enrichment",
    name: "Enrichment",
    title: ["Records that", "fill themselves in."],
    subtitle: "Add a domain or an email. Vult fills in the company, the person and the context — and keeps it fresh.",
    sections: [
      {
        eyebrow: "Companies", lead: "From a domain to a full profile.", rest: "Industry, size, location, funding and tech stack, added the moment a record is created.",
        points: ["30+ firmographic fields", "Refreshed every month", "Source shown for every value"],
        mock: "enrich", mockTitle: "Halbrook", rows: [
          { title: "Industry", detail: "Logistics software", pill: "New", tone: "done" },
          { title: "Employees", detail: "201–500", pill: "New", tone: "done" },
          { title: "HQ", detail: "Rotterdam, NL", pill: "New", tone: "done" },
          { title: "Funding", detail: "Series B", pill: "Updated", tone: "run" },
        ],
      },
      {
        eyebrow: "People", lead: "Know who you’re talking to.", rest: "Job titles, seniority and social profiles from an email address.",
        points: ["Role and seniority", "Job-change alerts", "Duplicate detection"],
        mock: "list", mockTitle: "Job changes this week", rows: [
          { title: "Kenji Tanaka", detail: "Now Head of RevOps at Solvane", pill: "Moved", tone: "run" },
          { title: "Amara Mensah", detail: "Promoted to VP Sales", pill: "Promoted", tone: "done" },
        ],
      },
      {
        eyebrow: "Signals", lead: "Know when to reach out.", rest: "Hiring, funding and website visits surface as signals on the record and in your inbox.",
        points: ["Funding and hiring signals", "Website intent", "Signals can trigger workflows"],
        mock: "list", mockTitle: "Signals", rows: [
          { title: "Solvane opened an EU office", detail: "2 days ago", pill: "Expansion", tone: "done" },
          { title: "Brightvale viewed pricing 4×", detail: "This week", pill: "Intent", tone: "run" },
        ],
      },
    ],
    faqs: [
      { q: "Where does the data come from?", a: "A mix of public sources and licensed providers. Every enriched value shows its source and when it was last checked." },
      { q: "Will enrichment overwrite my edits?", a: "Never. Values your team entered always win; enrichment only fills empty fields unless you opt in." },
      { q: "How do credits work?", a: "One credit enriches one company or person. Unused credits roll over for one month." },
    ],
    cta: "Stop typing what Vult already knows.",
  },
};
