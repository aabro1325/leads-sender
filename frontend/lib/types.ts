export type LeadStatus =
  | "PENDING"
  | "NORMALIZING"
  | "PERMUTING"
  | "VERIFYING"
  | "VERIFIED"
  | "DEAD"
  | "RESEARCHING"
  | "DRAFTING"
  | "SENDING"
  | "SENT"
  | "FAILED";

export interface LeadEvent {
  ts: string;
  lead_id: string;
  step: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: Record<string, unknown> | null;
}

export interface Lead {
  id: string;
  source_md: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  domain: string | null;
  title: string | null;
  linkedin: string | null;
  candidate_emails: string[];
  verified_email: string | null;
  research: Record<string, unknown> | null;
  draft_subject: string | null;
  draft_body: string | null;
  resend_message_id: string | null;
  status: LeadStatus;
  events: LeadEvent[];
  created_at: string;
}

export const STEPS = [
  "normalize",
  "permute",
  "verify",
  "research",
  "draft",
  "send",
] as const;
export type Step = (typeof STEPS)[number];
