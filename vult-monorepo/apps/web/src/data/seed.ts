import type {
  Activity, Call, Chat, Company, Dashboard, DB, Deal, DealStage, Email, EmailTemplate, InboxItem, Industry, Meeting, Member,
  Note, Person, Segment, Sequence, SavedList, Task, Workflow,
} from "./types";

/** All names, companies and numbers below are fictional demo data. */

export const DB_VERSION = 4;

// Small deterministic PRNG so every first load produces the same workspace.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86400000;
const iso = (base: number, days: number, hour = 10, minute = 0) => {
  const d = new Date(base + days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const MEMBERS: Member[] = [
  { id: "m1", name: "Dani Rossi", email: "dani@ridgeway.example", role: "Admin", title: "Head of Sales" },
  { id: "m2", name: "Maya Ruiz", email: "maya@ridgeway.example", role: "Member", title: "Account Executive" },
  { id: "m3", name: "Theo Lindqvist", email: "theo@ridgeway.example", role: "Member", title: "Account Executive" },
  { id: "m4", name: "Ines Okafor", email: "ines@ridgeway.example", role: "Member", title: "Solutions Engineer" },
  { id: "m5", name: "Jun Park", email: "jun@ridgeway.example", role: "Member", title: "SDR" },
  { id: "m6", name: "Priya Shah", email: "priya@ridgeway.example", role: "Guest", title: "RevOps Contractor" },
];

const COMPANY_NAMES: [string, Industry, Segment, string, string][] = [
  ["Kelvra", "Software", "Mid-market", "Amsterdam", "Netherlands"],
  ["Ortiq", "Fintech", "Enterprise", "London", "United Kingdom"],
  ["Halbrook", "Logistics", "Enterprise", "Rotterdam", "Netherlands"],
  ["Maplewing", "Retail", "Mid-market", "Toronto", "Canada"],
  ["Solvane", "Software", "Enterprise", "Berlin", "Germany"],
  ["Nodeline", "Software", "SMB", "Austin", "United States"],
  ["Brightvale", "Healthcare", "Mid-market", "Dublin", "Ireland"],
  ["Cobalt & Finch", "Media", "SMB", "Brooklyn", "United States"],
  ["Tessaro", "Manufacturing", "Mid-market", "Milan", "Italy"],
  ["Wendell Labs", "Education", "SMB", "Edinburgh", "United Kingdom"],
  ["Arden Freight", "Logistics", "Mid-market", "Antwerp", "Belgium"],
  ["Lumora Health", "Healthcare", "Enterprise", "Boston", "United States"],
  ["Quillstone", "Fintech", "Mid-market", "Zurich", "Switzerland"],
  ["Pinecrest Analytics", "Software", "SMB", "Denver", "United States"],
  ["Orrin Bio", "Healthcare", "Mid-market", "Copenhagen", "Denmark"],
  ["Mirakai", "Retail", "Enterprise", "Singapore", "Singapore"],
  ["Halcyon Works", "Manufacturing", "Enterprise", "Stuttgart", "Germany"],
  ["Fernhollow", "Media", "SMB", "Lisbon", "Portugal"],
  ["Driftline", "Software", "Mid-market", "Seattle", "United States"],
  ["Vantor Pay", "Fintech", "SMB", "Madrid", "Spain"],
  ["Northwell Studio", "Media", "SMB", "Oslo", "Norway"],
  ["Calder Robotics", "Manufacturing", "Mid-market", "Lyon", "France"],
  ["Sablewood", "Education", "Mid-market", "Melbourne", "Australia"],
  ["Gridmark", "Software", "Enterprise", "San Francisco", "United States"],
  ["Ashby & Lowe", "Retail", "SMB", "Manchester", "United Kingdom"],
  ["Pelican Ledger", "Fintech", "Mid-market", "New York", "United States"],
  ["Tidewater Supply", "Logistics", "SMB", "Hamburg", "Germany"],
  ["Corvid Security", "Software", "Mid-market", "Tel Aviv", "Israel"],
  ["Meadowlark Learning", "Education", "SMB", "Vancouver", "Canada"],
  ["Ironleaf Foods", "Retail", "Enterprise", "Chicago", "United States"],
];

const FIRST = ["Ava", "Liam", "Noor", "Mateo", "Sofia", "Kenji", "Amara", "Lucas", "Elif", "Oscar", "Zara", "Felix", "Hana", "Rafael", "Ingrid", "Tariq", "Chloe", "Diego", "Mei", "Samuel", "Leila", "Jonas", "Aisha", "Pablo", "Freya", "Omar", "Clara", "Nikhil", "Greta", "Yusuf"];
const LAST = ["Bennett", "Kowalski", "Haddad", "Silva", "Novak", "Tanaka", "Mensah", "Moreau", "Yilmaz", "Lund", "Rahman", "Weber", "Sato", "Costa", "Berg", "Aziz", "Laurent", "Navarro", "Chen", "Adeyemi", "Farouk", "Richter", "Bello", "Ortega", "Nilsen", "Saleh", "Fischer", "Iyer", "Holm", "Demir"];
const TITLES = ["VP Sales", "Head of RevOps", "CTO", "Director of Operations", "Founder & CEO", "Procurement Lead", "Head of Growth", "Sales Manager", "CFO", "Product Lead", "IT Director", "Customer Success Lead"];
const DESCRIPTIONS: Record<Industry, string> = {
  Software: "Builds workflow software for distributed teams.",
  Fintech: "Payments and treasury tooling for finance teams.",
  Healthcare: "Patient engagement and clinical operations platform.",
  Logistics: "Freight visibility and warehouse orchestration.",
  Retail: "Omnichannel retailer with a fast-growing online business.",
  Media: "Independent studio producing branded content.",
  Manufacturing: "Precision components for industrial automation.",
  Education: "Learning platform for schools and universities.",
};

const DEAL_NAMES = ["Platform rollout", "Annual renewal", "EMEA expansion", "Pilot · 25 seats", "Data warehouse sync", "Agents add-on", "Multi-region", "Seat true-up", "Sales team expansion", "Enrichment bundle", "Partner portal", "Workflow migration", "Enterprise upgrade", "Support org pilot", "APAC launch", "Security review", "Analytics add-on", "Team plan upgrade", "Procurement consolidation", "Marketing workspace", "Customer success rollout", "Two-year renewal", "Field sales pilot", "API access", "Board reporting"];

export function createSeed(now = Date.now()): DB {
  const r = rng(20261019);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)]!;
  const int = (min: number, max: number) => Math.floor(min + r() * (max - min + 1));
  const owners = MEMBERS.filter((m) => m.role !== "Guest").map((m) => m.id);

  const companies: Company[] = COMPANY_NAMES.map(([name, industry, segment, city, country], i) => {
    const employees = segment === "Enterprise" ? int(1200, 9000) : segment === "Mid-market" ? int(150, 1100) : int(12, 140);
    return {
      id: `c${i + 1}`,
      name,
      domain: name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "") + ".example",
      industry,
      segment,
      employees,
      arr: Math.round((employees * int(800, 2600)) / 1000) * 1000,
      city,
      country,
      ownerId: owners[i % owners.length]!,
      description: DESCRIPTIONS[industry],
      createdAt: iso(now, -int(40, 400)),
      lastInteraction: iso(now, -int(0, 30), int(8, 17)),
    };
  });

  const people: Person[] = Array.from({ length: 60 }, (_, i) => {
    const company = companies[i % companies.length]!;
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7 + Math.floor(i / FIRST.length) * 11) % LAST.length]}`;
    const [first, last] = name.toLowerCase().split(" ");
    return {
      id: `p${i + 1}`,
      name,
      email: `${first}.${last}@${company.domain}`,
      title: TITLES[(i * 5) % TITLES.length]!,
      companyId: company.id,
      phone: `+1 555 01${String(10 + i).padStart(2, "0")}`,
      city: company.city,
      strength: pick(["Very strong", "Strong", "Medium", "Weak"] as const),
      ownerId: company.ownerId,
      createdAt: iso(now, -int(10, 300)),
      lastInteraction: iso(now, -int(0, 45), int(8, 17)),
    };
  });

  const stagePlan: DealStage[] = ["Lead", "Lead", "Lead", "Lead", "Qualified", "Qualified", "Qualified", "Qualified", "Qualified", "Proposal", "Proposal", "Proposal", "Proposal", "Negotiation", "Negotiation", "Negotiation", "Negotiation", "Won", "Won", "Won", "Won", "Won", "Lost", "Lost", "Lost"];
  const nextSteps = ["Book discovery call", "Send revised order form", "Security questionnaire", "Technical deep-dive", "Confirm seat count", "Legal review of DPA", "Pricing call", "Champion intro to CFO", "Kickoff scheduled", "Share ROI model"];
  const deals: Deal[] = DEAL_NAMES.map((name, i) => {
    const company = companies[(i * 7) % companies.length]!;
    const contact = people.find((p) => p.companyId === company.id);
    const stage = stagePlan[i]!;
    const closed = stage === "Won" || stage === "Lost";
    return {
      id: `d${i + 1}`,
      name,
      companyId: company.id,
      contactId: contact?.id,
      stage,
      value: int(6, 140) * 1000 + (r() > 0.5 ? 500 : 0),
      ownerId: company.ownerId,
      closeDate: iso(now, closed ? -int(2, 120) : int(3, 80)),
      source: pick(["Inbound", "Outbound", "Referral", "Partner", "Event"] as const),
      nextStep: closed ? (stage === "Won" ? "Kickoff scheduled" : "Revisit next quarter") : nextSteps[i % nextSteps.length]!,
      createdAt: iso(now, -int(20, 200)),
    };
  });

  const ref = (kind: "companies" | "people" | "deals", id: string) => ({ kind, id });
  const taskDefs: [string, number | null, number, "Low" | "Medium" | "High", [("companies" | "people" | "deals"), string] | null, boolean][] = [
    ["Send revised order form", 0, 0, "High", ["deals", "d1"], false],
    ["Prep pricing call notes", 0, 1, "Medium", ["deals", "d2"], false],
    ["Chase DPA with legal", -3, 0, "High", ["deals", "d3"], false],
    ["Intro call with new RevOps lead", 2, 0, "Medium", ["companies", "c5"], false],
    ["Share security pack", 1, 3, "Medium", ["deals", "d16"], false],
    ["Update forecast for Q4 review", 3, 0, "Low", null, false],
    ["Follow up after webinar", -1, 4, "Low", ["people", "p7"], false],
    ["Draft mutual action plan", 5, 1, "Medium", ["deals", "d14"], false],
    ["Book technical deep-dive", 4, 3, "Medium", ["deals", "d10"], false],
    ["Review enrichment results", 7, 5, "Low", ["companies", "c12"], false],
    ["Send case study to champion", 2, 2, "Low", ["people", "p12"], false],
    ["Confirm renewal terms", 9, 0, "High", ["deals", "d18"], false],
    ["Log notes from QBR", -2, 1, "Medium", ["companies", "c2"], true],
    ["Clean up duplicate contacts", -5, 5, "Low", null, true],
    ["Prepare board slide", null, 0, "Medium", null, false],
    ["Introduce SE to Brightvale", 1, 3, "Medium", ["companies", "c7"], false],
    ["Call back procurement", 0, 2, "High", ["deals", "d19"], false],
    ["Send onboarding checklist", -4, 4, "Low", ["deals", "d20"], true],
  ];
  const tasks: Task[] = taskDefs.map(([title, due, who, priority, rec, done], i) => ({
    id: `t${i + 1}`,
    title,
    due: due == null ? undefined : iso(now, due, 17),
    assigneeId: MEMBERS[who]!.id,
    done,
    priority,
    record: rec ? ref(rec[0], rec[1]) : undefined,
    createdAt: iso(now, -int(1, 20)),
  }));

  const notes: Note[] = [
    {
      id: "n1", title: "Kelvra discovery call recap", record: ref("companies", "c1"), authorId: "m1", pinned: true,
      body: "## Summary\nKelvra wants to replace two tools and a weekly spreadsheet. **Champion:** Ava Bennett (VP Sales).\n\n## Pain points\n- Pipeline reviews take half a day\n- No single view of email and meeting history\n- Forecast is rebuilt by hand every Friday\n\n## Next steps\n1. Send revised order form\n2. Pricing review on Thursday",
      createdAt: iso(now, -6), updatedAt: iso(now, -1),
    },
    {
      id: "n2", title: "Q4 territory plan", authorId: "m1",
      body: "## Territories\n- **EMEA:** Theo Lindqvist\n- **North America:** Maya Ruiz\n- **APAC:** Jun Park (with partner support)\n\nFocus on mid-market logistics and fintech accounts with 200+ employees.",
      createdAt: iso(now, -17), updatedAt: iso(now, -9),
    },
    {
      id: "n3", title: "Halbrook security review", record: ref("deals", "d3"), authorId: "m4",
      body: "Legal is reviewing the DPA. They asked for:\n- Sub-processor list\n- Data residency confirmation (EU)\n- Pen-test summary\n\n_Owner: Ines_",
      createdAt: iso(now, -4), updatedAt: iso(now, -2),
    },
    {
      id: "n4", title: "Objection handling: pricing", authorId: "m2",
      body: "When a buyer says the price is high:\n1. Anchor on hours saved per rep\n2. Offer annual billing (20% off)\n3. Propose a scoped pilot instead of discounting",
      createdAt: iso(now, -30), updatedAt: iso(now, -12),
    },
    {
      id: "n5", title: "Solvane — new RevOps lead", record: ref("companies", "c5"), authorId: "m5",
      body: "Agent research flagged a new Head of RevOps who previously ran a Vult rollout elsewhere. Good warm intro angle.",
      createdAt: iso(now, -1), updatedAt: iso(now, -1),
    },
    {
      id: "n6", title: "Weekly pipeline review — notes", authorId: "m3",
      body: "- 3 deals slipped to next month\n- Win rate steady at 34%\n- Need more Qualified → Proposal conversion in EMEA",
      createdAt: iso(now, -7), updatedAt: iso(now, -7),
    },
  ];

  const templates: EmailTemplate[] = [
    { id: "et1", name: "Follow-up after demo", subject: "Great speaking today, {{first_name}}", body: "Hi {{first_name}},\n\nThanks for the time today. As promised, here's a short recap and the next steps we discussed.\n\nBest,\nDani" },
    { id: "et2", name: "Meeting request", subject: "15 minutes next week?", body: "Hi {{first_name}},\n\nI noticed {{company}} is growing its sales team. Would you be open to a quick call next week?\n\nBest,\nDani" },
    { id: "et3", name: "Renewal check-in", subject: "Your renewal is coming up", body: "Hi {{first_name}},\n\nYour renewal date is approaching. Shall we schedule a short review of how things are going?\n\nThanks,\nDani" },
  ];

  const emails: Email[] = [
    { id: "e1", folder: "drafts", to: "ava.bennett@kelvra.example", subject: "Revised order form", body: "Hi Ava,\n\nAttached is the revised order form with annual billing applied.\n\nBest,\nDani", record: ref("deals", "d1"), updatedAt: iso(now, 0, 9, 20) },
    { id: "e2", folder: "drafts", to: "legal@halbrook.example", subject: "DPA — sub-processor list", body: "Hello,\n\nPlease find our current sub-processor list below.", record: ref("deals", "d3"), updatedAt: iso(now, -1, 16) },
    { id: "e3", folder: "outbox", to: "noor.haddad@ortiq.example", subject: "Following up on the QBR", body: "Hi Noor,\n\nThanks again for the QBR.", record: ref("companies", "c2"), updatedAt: iso(now, 0, 8, 45) },
    { id: "e4", folder: "sent", to: "mateo.silva@halbrook.example", subject: "Security pack", body: "Hi Mateo,\n\nHere is the security pack.", updatedAt: iso(now, -2, 11) },
  ];

  const meetings: Meeting[] = [
    { id: "mt1", title: "Kelvra · Pricing review", start: iso(now, 0, 10, 30), end: iso(now, 0, 11), attendees: ["Ava Bennett", "Maya Ruiz"], record: ref("deals", "d1") },
    { id: "mt2", title: "Solvane · Technical deep-dive", start: iso(now, 0, 13), end: iso(now, 0, 13, 45), attendees: ["Kenji Tanaka", "Ines Okafor", "Jun Park"], record: ref("companies", "c5") },
    { id: "mt3", title: "Weekly pipeline review", start: iso(now, 0, 16), end: iso(now, 0, 16, 30), attendees: ["Sales team"] },
  ];

  const calls: Call[] = Array.from({ length: 8 }, (_, i) => {
    const p = people[(i * 5) % people.length]!;
    return {
      id: `cl${i + 1}`,
      title: `Call with ${p.name}`,
      at: iso(now, -i, 9 + (i % 7), 15),
      durationMin: int(4, 42),
      personId: p.id,
      outcome: pick(["Connected", "Connected", "Voicemail", "No answer"] as const),
      summary: pick([
        "Discussed timeline; budget approved for Q1.",
        "Asked for a security review before moving forward.",
        "Interested in agents for inbound qualification.",
        "Left a voicemail about the renewal.",
      ]),
    };
  });

  const activities: Activity[] = [];
  let a = 0;
  for (const d of deals) {
    activities.push({ id: `a${++a}`, record: ref("deals", d.id), kind: "created", text: "Deal created", at: d.createdAt, actorId: d.ownerId });
    activities.push({ id: `a${++a}`, record: ref("deals", d.id), kind: "email", text: `Email: “${pick(["Next steps", "Revised proposal", "Quick question", "Security pack"])}”`, at: iso(now, -int(3, 15)), actorId: d.ownerId });
    activities.push({ id: `a${++a}`, record: ref("deals", d.id), kind: "meeting", text: `Meeting: ${pick(["Discovery", "Demo", "Pricing review", "Technical deep-dive"])}`, at: iso(now, -int(1, 10)), actorId: d.ownerId });
    activities.push({ id: `a${++a}`, record: ref("deals", d.id), kind: "stage", text: `Stage changed to ${d.stage}`, at: iso(now, -int(0, 4)), actorId: d.ownerId });
  }
  for (const c of companies) {
    activities.push({ id: `a${++a}`, record: ref("companies", c.id), kind: "enrich", text: "Record enriched — 6 fields updated", at: iso(now, -int(5, 40)) });
    activities.push({ id: `a${++a}`, record: ref("companies", c.id), kind: "email", text: "Email thread with 3 people", at: c.lastInteraction, actorId: c.ownerId });
  }
  for (const p of people) {
    activities.push({ id: `a${++a}`, record: ref("people", p.id), kind: "email", text: "Replied to your email", at: p.lastInteraction });
  }

  const inbox: InboxItem[] = [
    { id: "i1", kind: "agent", text: "Research agent finished a brief on Solvane — new Head of RevOps found.", at: iso(now, 0, 8, 2), read: false, record: ref("companies", "c5") },
    { id: "i2", kind: "mention", text: "Maya Ruiz mentioned you on “Kelvra discovery call recap”.", at: iso(now, 0, 7, 40), read: false, record: ref("companies", "c1") },
    { id: "i3", kind: "assigned", text: "Theo Lindqvist assigned you “Chase DPA with legal”.", at: iso(now, -1, 15), read: false, record: ref("deals", "d3") },
    { id: "i4", kind: "reply", text: "Noor Haddad replied to “Following up on the QBR”.", at: iso(now, -1, 11), read: true, record: ref("companies", "c2") },
    { id: "i5", kind: "workflow", text: "Workflow “Route inbound demo requests” ran 14 times overnight.", at: iso(now, -1, 6), read: true },
    { id: "i6", kind: "agent", text: "Pipeline guardian flagged 3 stalled deals.", at: iso(now, -2, 9), read: true },
  ];

  const workflows: Workflow[] = [
    {
      id: "w1", name: "Route inbound demo requests", description: "Research, score and assign every demo request.", status: "Live", runs7d: 142, failures7d: 3, updatedAt: iso(now, -2),
      steps: [
        { id: "s1", type: "trigger", title: "Form submitted", config: "Website · “Book a demo” form" },
        { id: "s2", type: "agent", title: "Research the company", config: "Enrich size, industry and tech stack from the web" },
        { id: "s3", type: "condition", title: "Company size ≥ 200", config: "If true continue, else send nurture email" },
        { id: "s4", type: "action", title: "Assign owner", config: "Round-robin across Account Executives" },
        { id: "s5", type: "notify", title: "Post to #inbound", config: "Message with research summary" },
      ],
    },
    {
      id: "w2", name: "Kick off won deals", description: "Create onboarding tasks when a deal is won.", status: "Live", runs7d: 6, failures7d: 0, updatedAt: iso(now, -9),
      steps: [
        { id: "s1", type: "trigger", title: "Deal stage changes to Won", config: "Any pipeline" },
        { id: "s2", type: "agent", title: "Draft a kickoff plan", config: "Use notes and emails on the deal" },
        { id: "s3", type: "action", title: "Create onboarding task", config: "Assign to Customer Success" },
        { id: "s4", type: "notify", title: "Notify #wins", config: "Include deal value and owner" },
      ],
    },
    {
      id: "w3", name: "Stalled deal nudges", description: "Flag deals without activity for 10 days.", status: "Paused", runs7d: 0, failures7d: 0, updatedAt: iso(now, -21),
      steps: [
        { id: "s1", type: "trigger", title: "Every weekday at 9:00", config: "Schedule" },
        { id: "s2", type: "condition", title: "No activity in 10 days", config: "Open deals only" },
        { id: "s3", type: "action", title: "Create follow-up task", config: "Assign to deal owner" },
      ],
    },
  ];

  const sequences: Sequence[] = [
    {
      id: "sq1", name: "Inbound follow-up", status: "Active", enrolled: 48, replyRate: 0.31, updatedAt: iso(now, -3),
      steps: [
        { id: "q1", type: "email", title: "Thanks for reaching out", delayDays: 0, body: "Hi {{first_name}}, thanks for your interest in Vult…" },
        { id: "q2", type: "wait", title: "Wait", delayDays: 2, body: "" },
        { id: "q3", type: "email", title: "Quick resources", delayDays: 0, body: "Here are two short guides teams find useful…" },
        { id: "q4", type: "task", title: "Call if no reply", delayDays: 3, body: "Call the lead and log the outcome." },
      ],
    },
    {
      id: "sq2", name: "Renewal 60 days out", status: "Active", enrolled: 12, replyRate: 0.58, updatedAt: iso(now, -12),
      steps: [
        { id: "q1", type: "email", title: "Renewal check-in", delayDays: 0, body: "Your renewal is coming up…" },
        { id: "q2", type: "wait", title: "Wait", delayDays: 7, body: "" },
        { id: "q3", type: "call", title: "Success review call", delayDays: 0, body: "Review usage and expansion opportunities." },
      ],
    },
    {
      id: "sq3", name: "Event attendees", status: "Draft", enrolled: 0, replyRate: 0, updatedAt: iso(now, -1),
      steps: [{ id: "q1", type: "email", title: "Great meeting you", delayDays: 0, body: "Hi {{first_name}}, great to meet you at the event…" }],
    },
  ];

  const dashboards: Dashboard[] = [
    { id: "db1", name: "Sales performance", description: "Pipeline, revenue and rep performance", favorite: true, reports: ["Pipeline by stage", "Closed-won by month", "Win rate by owner", "Deals by source"], createdAt: iso(now, -40) },
    { id: "db2", name: "Customer health", description: "Engagement and renewals", favorite: false, reports: ["Accounts by segment", "Last interaction"], createdAt: iso(now, -18) },
    { id: "db3", name: "Companies by country", description: "Where our accounts are", favorite: false, reports: ["Companies by country"], createdAt: iso(now, 0) },
  ];

  const lists: SavedList[] = [
    { id: "l1", name: "Q4 target accounts", kind: "companies", color: "#7048e8", recordIds: ["c1", "c2", "c5", "c7", "c12", "c16", "c24"] },
    { id: "l2", name: "Enterprise renewals", kind: "deals", color: "#0b7285", recordIds: ["d2", "d18", "d22"] },
  ];

  const chats: Chat[] = [
    {
      id: "ch1", title: "Pipeline review",
      messages: [
        { id: "x1", role: "user", text: "Which deals are most at risk this month?", at: iso(now, -1, 9) },
        { id: "x2", role: "assistant", text: "Three deals look at risk: **EMEA expansion** (no reply in 11 days), **Seat true-up** (champion left) and **Security review** (legal pending). Want me to draft follow-ups?", at: iso(now, -1, 9, 1) },
      ],
    },
    {
      id: "ch2", title: "Agent: account research",
      messages: [
        { id: "x1", role: "user", text: "Research Solvane before tomorrow's call.", at: iso(now, -1, 14) },
        { id: "x2", role: "assistant", text: "Solvane opened an EU office in Lisbon and hired a new Head of RevOps. Their ICP fit score is 92. I added both facts to the company record.", at: iso(now, -1, 14, 2) },
      ],
    },
  ];

  return {
    version: DB_VERSION,
    workspace: {
      name: "Ridgeway Labs",
      domain: "ridgeway.example",
      plan: "Pro",
      trialEndsAt: iso(now, 12),
      checklist: { import: false, invite: false, deal: false, workflow: false, report: false, email: false },
    },
    members: MEMBERS,
    companies,
    people,
    deals,
    tasks,
    notes,
    emails,
    templates,
    activities,
    meetings,
    calls,
    inbox,
    workflows,
    sequences,
    dashboards,
    lists,
    chats,
  };
}

/** Meetings are demo data for "today": rebuild them when the stored ones are from another day. */
export function refreshMeetings(db: DB, now = Date.now()): DB {
  const today = new Date(now).toDateString();
  if (db.meetings.some((m) => new Date(m.start).toDateString() === today)) return db;
  return { ...db, meetings: createSeed(now).meetings };
}
