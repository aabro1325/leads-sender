import type { Lead } from "./types";

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

export const STREAM_BASE = BASE;
