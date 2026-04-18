"use client";
import { useCallback, useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { LeadRow } from "@/components/LeadCard";
import { LeadDetail } from "@/components/LeadDetail";
import { UploadMd } from "@/components/UploadMd";
import { deleteLead, listLeads, STREAM_BASE } from "@/lib/api";
import { useSSE } from "@/lib/sse";
import type { Lead } from "@/lib/types";

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const events = useSSE(`${STREAM_BASE}/api/stream`);

  const refresh = useCallback(async () => {
    const data = await listLeads();
    setLeads(data);
    if (!selectedId && data.length > 0) {
      setSelectedId(data[0].id);
    }
  }, [selectedId]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteLead(id);
      } catch (err) {
        console.error(err);
        return;
      }
      const data = await listLeads();
      setLeads(data);
      if (selectedId === id) {
        setSelectedId(data.length > 0 ? data[0].id : null);
      }
    },
    [selectedId],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (events.length === 0) return;
    const last = events[events.length - 1];
    if (
      ["pipeline", "normalize", "permute", "verify", "research", "draft", "send"].includes(
        last.step,
      )
    ) {
      refresh();
    }
  }, [events, refresh]);

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-stone-800 bg-stone-950">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-coral-400" />
          <h1 className="text-lg font-bold tracking-tight">Lead Sender</h1>
        </div>
        <span className="text-[10px] text-stone-500 tabular-nums">
          {events.length} live events
        </span>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left sidebar */}
        <aside className="w-[360px] shrink-0 border-r border-stone-800 flex flex-col bg-stone-950/80">
          <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
              Leads
            </h2>
            <span className="text-[10px] text-stone-600 tabular-nums">{leads.length}</span>
          </div>

          <UploadMd
            onCreated={async () => {
              const data = await listLeads();
              setLeads(data);
              if (data.length > 0) setSelectedId(data[0].id);
            }}
          />

          <div className="flex-1 overflow-y-auto">
            {leads.map((l) => (
              <LeadRow
                key={l.id}
                lead={l}
                selected={l.id === selectedId}
                onClick={() => setSelectedId(l.id)}
                onDelete={handleDelete}
              />
            ))}
            {leads.length === 0 && (
              <div className="p-4 text-stone-600 text-sm text-center">
                No leads yet. Add one above.
              </div>
            )}
          </div>
        </aside>

        {/* Right panel */}
        {selectedId ? (
          <LeadDetail key={selectedId} leadId={selectedId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-700">
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a lead to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
