export type ID = string;

export const DEAL_STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const INDUSTRIES = ["Software", "Fintech", "Healthcare", "Logistics", "Retail", "Media", "Manufacturing", "Education"] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const SEGMENTS = ["SMB", "Mid-market", "Enterprise"] as const;
export type Segment = (typeof SEGMENTS)[number];

export interface Member {
  id: ID;
  name: string;
  email: string;
  role: "Admin" | "Member" | "Guest";
  title: string;
}

export interface Company {
  id: ID;
  name: string;
  domain: string;
  industry: Industry;
  segment: Segment;
  employees: number;
  arr: number;
  city: string;
  country: string;
  ownerId: ID;
  description: string;
  createdAt: string;
  lastInteraction: string;
}

export interface Person {
  id: ID;
  name: string;
  email: string;
  title: string;
  companyId: ID;
  phone: string;
  city: string;
  strength: "Very strong" | "Strong" | "Medium" | "Weak";
  ownerId: ID;
  createdAt: string;
  lastInteraction: string;
}

export interface Deal {
  id: ID;
  name: string;
  companyId: ID;
  contactId?: ID;
  stage: DealStage;
  value: number;
  ownerId: ID;
  closeDate: string;
  source: "Inbound" | "Outbound" | "Referral" | "Partner" | "Event";
  nextStep: string;
  createdAt: string;
}

export type RecordKind = "companies" | "people" | "deals";

export interface RecordRef {
  kind: RecordKind;
  id: ID;
}

export interface Task {
  id: ID;
  title: string;
  due?: string;
  assigneeId: ID;
  done: boolean;
  priority: "Low" | "Medium" | "High";
  record?: RecordRef;
  createdAt: string;
}

export interface Note {
  id: ID;
  title: string;
  body: string; // Markdown
  record?: RecordRef;
  authorId: ID;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Email {
  id: ID;
  folder: "drafts" | "outbox" | "sent";
  to: string;
  subject: string;
  body: string;
  record?: RecordRef;
  updatedAt: string;
}

export interface EmailTemplate {
  id: ID;
  name: string;
  subject: string;
  body: string;
}

export interface Activity {
  id: ID;
  record: RecordRef;
  kind: "email" | "meeting" | "call" | "stage" | "note" | "enrich" | "created" | "task";
  text: string;
  at: string;
  actorId?: ID;
}

export interface Meeting {
  id: ID;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  record?: RecordRef;
}

export interface Call {
  id: ID;
  title: string;
  at: string;
  durationMin: number;
  personId: ID;
  outcome: "Connected" | "Voicemail" | "No answer";
  summary: string;
}

export interface InboxItem {
  id: ID;
  kind: "mention" | "assigned" | "agent" | "reply" | "workflow";
  text: string;
  at: string;
  read: boolean;
  record?: RecordRef;
}

export type WorkflowStepType = "trigger" | "condition" | "agent" | "action" | "notify" | "wait";

export interface WorkflowStep {
  id: ID;
  type: WorkflowStepType;
  title: string;
  config: string;
}

export interface Workflow {
  id: ID;
  name: string;
  description: string;
  status: "Live" | "Paused" | "Draft";
  steps: WorkflowStep[];
  runs7d: number;
  failures7d: number;
  updatedAt: string;
}

export type SequenceStepType = "email" | "wait" | "task" | "call";

export interface SequenceStep {
  id: ID;
  type: SequenceStepType;
  title: string;
  delayDays: number;
  body: string;
}

export interface Sequence {
  id: ID;
  name: string;
  status: "Active" | "Paused" | "Draft";
  steps: SequenceStep[];
  enrolled: number;
  replyRate: number;
  updatedAt: string;
}

export interface Dashboard {
  id: ID;
  name: string;
  description: string;
  favorite: boolean;
  reports: string[];
  createdAt: string;
}

export interface SavedList {
  id: ID;
  name: string;
  kind: RecordKind;
  color: string;
  recordIds: ID[];
}

export interface ChatMessage {
  id: ID;
  role: "user" | "assistant";
  text: string;
  at: string;
}

export interface Chat {
  id: ID;
  title: string;
  messages: ChatMessage[];
}

export interface Workspace {
  name: string;
  domain: string;
  plan: "Free" | "Plus" | "Pro" | "Enterprise";
  trialEndsAt: string;
  checklist: Record<ChecklistKey, boolean>;
}

export type ChecklistKey = "import" | "invite" | "deal" | "workflow" | "report" | "email";

export interface DB {
  version: number;
  workspace: Workspace;
  members: Member[];
  companies: Company[];
  people: Person[];
  deals: Deal[];
  tasks: Task[];
  notes: Note[];
  emails: Email[];
  templates: EmailTemplate[];
  activities: Activity[];
  meetings: Meeting[];
  calls: Call[];
  inbox: InboxItem[];
  workflows: Workflow[];
  sequences: Sequence[];
  dashboards: Dashboard[];
  lists: SavedList[];
  chats: Chat[];
}
