import type { Lead } from "./types";

export interface QueueStats {
  active_count: number;
  queued_count: number;
  queue: { id: string; position: number; first_name: string | null; last_name: string | null; company: string | null }[];
}

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function listLeads(): Promise<Lead[]> {
  const r = await fetch(`${BASE}/api/leads`, { cache: "no-store" });
  return r.json();
}

export async function getLead(id: string): Promise<Lead> {
  const r = await fetch(`${BASE}/api/leads/${id}`, { cache: "no-store" });
  return r.json();
}

export async function createLead(markdown: string): Promise<Lead> {
  const r = await fetch(`${BASE}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown }),
  });
  return r.json();
}

export async function retryLead(id: string): Promise<Lead> {
  const r = await fetch(`${BASE}/api/leads/${id}/retry`, { method: "POST" });
  if (!r.ok) throw new Error(`retry failed: ${r.status}`);
  return r.json();
}

export async function deleteLead(id: string): Promise<void> {
  const r = await fetch(`${BASE}/api/leads/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(`delete failed: ${r.status}`);
}

export async function getQueueStats(): Promise<QueueStats> {
  const r = await fetch(`${BASE}/api/queue`, { cache: "no-store" });
  return r.json();
}

export const STREAM_BASE = BASE;
