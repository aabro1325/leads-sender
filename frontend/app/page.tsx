"use client";
import { useCallback, useEffect, useState } from "react";
import { LeadCard } from "@/components/LeadCard";
import { LogStream } from "@/components/LogStream";
import { UploadMd } from "@/components/UploadMd";
import { listLeads, STREAM_BASE } from "@/lib/api";
import { useSSE } from "@/lib/sse";
import type { Lead } from "@/lib/types";

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const events = useSSE(`${STREAM_BASE}/api/stream`);

  const refresh = useCallback(async () => {
    setLeads(await listLeads());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (events.length === 0) return;
    const last = events[events.length - 1];
    if (
      ["pipeline", "normalize", "verify", "draft", "send"].includes(last.step)
    ) {
      refresh();
    }
  }, [events, refresh]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Lead Sender</h1>
        <span className="text-xs text-zinc-500">
          {events.length} live events
        </span>
      </header>

      <UploadMd onCreated={refresh} />

      <section>
        <h2 className="text-sm uppercase tracking-wide text-zinc-400 mb-2">
          Leads ({leads.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {leads.map((l) => (
            <LeadCard key={l.id} lead={l} />
          ))}
          {leads.length === 0 && (
            <div className="text-zinc-500 text-sm">No leads yet.</div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wide text-zinc-400 mb-2">
          Live log
        </h2>
        <LogStream events={events} heightClass="h-[500px]" />
      </section>
    </main>
  );
}
