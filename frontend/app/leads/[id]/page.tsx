"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LogStream } from "@/components/LogStream";
import { StepTimeline } from "@/components/StepTimeline";
import { getLead, STREAM_BASE } from "@/lib/api";
import { useSSE } from "@/lib/sse";
import type { Lead } from "@/lib/types";
import { cn, STATUS_COLORS } from "@/lib/utils";

export default function LeadPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const live = useSSE(`${STREAM_BASE}/api/stream/${id}`);

  useEffect(() => {
    getLead(id).then(setLead);
  }, [id]);

  useEffect(() => {
    if (live.length === 0) return;
    getLead(id).then(setLead);
  }, [live.length, id]);

  const streamingDraft = useMemo(() => {
    return live
      .filter((e) => e.step === "draft" && e.message === "token")
      .map((e) => (e.data?.chunk as string) ?? "")
      .join("");
  }, [live]);

  if (!lead) return <div className="p-6 text-zinc-500">Loading…</div>;

  const mergedEvents = [...(lead.events ?? []), ...live];

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-200">
        ← all leads
      </Link>

      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown"}
          </h1>
          <div className="text-zinc-400 text-sm">
            {lead.title} {lead.company && `· ${lead.company}`} {lead.domain && `· ${lead.domain}`}
          </div>
        </div>
        <span
          className={cn(
            "text-xs px-3 py-1 rounded-full uppercase tracking-wide",
            STATUS_COLORS[lead.status] ?? "bg-zinc-800",
          )}
        >
          {lead.status}
        </span>
      </header>

      <StepTimeline status={lead.status} events={mergedEvents} />

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Candidate emails">
          <ul className="text-sm space-y-1">
            {lead.candidate_emails.map((e) => (
              <li
                key={e}
                className={cn(
                  e === lead.verified_email ? "text-emerald-400" : "text-zinc-400",
                )}
              >
                {e === lead.verified_email ? "✓ " : "· "} {e}
              </li>
            ))}
            {lead.candidate_emails.length === 0 && (
              <li className="text-zinc-600">(not yet generated)</li>
            )}
          </ul>
        </Card>

        <Card title="Research">
          {lead.research ? (
            <pre className="text-xs whitespace-pre-wrap text-zinc-300">
              {JSON.stringify(lead.research, null, 2)}
            </pre>
          ) : (
            <div className="text-zinc-600 text-sm">(pending)</div>
          )}
        </Card>
      </div>

      <Card title="Drafted email">
        {lead.draft_subject ? (
          <div>
            <div className="text-xs text-zinc-500 mb-1">Subject</div>
            <div className="font-semibold mb-3">{lead.draft_subject}</div>
            <div className="text-xs text-zinc-500 mb-1">Body</div>
            <pre className="whitespace-pre-wrap text-sm text-zinc-200">{lead.draft_body}</pre>
          </div>
        ) : streamingDraft ? (
          <pre className="whitespace-pre-wrap text-sm text-violet-200">
            {streamingDraft}
            <span className="animate-pulse">▌</span>
          </pre>
        ) : (
          <div className="text-zinc-600 text-sm">(not yet drafted)</div>
        )}
        {lead.resend_message_id && (
          <div className="mt-3 text-xs text-emerald-400">
            Sent · resend id: {lead.resend_message_id}
          </div>
        )}
      </Card>

      <section>
        <h2 className="text-sm uppercase tracking-wide text-zinc-400 mb-2">
          Live log
        </h2>
        <LogStream events={mergedEvents} heightClass="h-[400px]" />
      </section>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}
