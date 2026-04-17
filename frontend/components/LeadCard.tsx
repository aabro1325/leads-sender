"use client";
import Link from "next/link";
import type { Lead } from "@/lib/types";
import { cn, STATUS_COLORS } from "@/lib/utils";

export function LeadCard({ lead }: { lead: Lead }) {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown lead";
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 transition p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold truncate">{name}</div>
          <div className="text-zinc-400 text-sm truncate">
            {lead.title || "—"} {lead.company && <>· {lead.company}</>}
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0",
            STATUS_COLORS[lead.status] ?? "bg-zinc-800",
          )}
        >
          {lead.status}
        </span>
      </div>
      {lead.verified_email && (
        <div className="mt-2 text-emerald-400 text-xs truncate">
          ✓ {lead.verified_email}
        </div>
      )}
      {lead.domain && (
        <div className="mt-1 text-zinc-500 text-xs truncate">{lead.domain}</div>
      )}
    </Link>
  );
}
