"use client";
import { useEffect, useMemo, useState } from "react";
import { Mail, Building2, Globe, Linkedin, User, Hash } from "lucide-react";
import { LogStream } from "./LogStream";
import { StepTimeline } from "./StepTimeline";
import { getLead, STREAM_BASE } from "@/lib/api";
import { useSSE } from "@/lib/sse";
import type { Lead } from "@/lib/types";
import { cn, STATUS_COLORS } from "@/lib/utils";

export function LeadDetail({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const live = useSSE(`${STREAM_BASE}/api/stream/${leadId}`);

  useEffect(() => {
    getLead(leadId).then(setLead);
  }, [leadId]);

  useEffect(() => {
    if (live.length === 0) return;
    getLead(leadId).then(setLead);
  }, [live.length, leadId]);

  const streamingDraft = useMemo(() => {
    return live
      .filter((e) => e.step === "draft" && e.message === "token")
      .map((e) => (e.data?.chunk as string) ?? "")
      .join("");
  }, [live]);

  if (!lead)
    return (
      <div className="flex-1 flex items-center justify-center text-stone-600">
        Loading...
      </div>
    );

  const name =
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown";
  const mergedEvents = [...(lead.events ?? []), ...live];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-stone-100">{name}</h2>
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium",
              STATUS_COLORS[lead.status] ?? "bg-stone-800",
            )}
          >
            {lead.status}
          </span>
        </div>
        <StepTimeline status={lead.status} events={mergedEvents} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Contact info */}
        <div className="px-6 py-4 border-b border-stone-800">
          <h3 className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-3">
            Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lead.verified_email && (
              <InfoRow icon={Mail} label="Email" value={lead.verified_email} accent />
            )}
            {lead.company && (
              <InfoRow icon={Building2} label="Company" value={lead.company} />
            )}
            {lead.domain && (
              <InfoRow icon={Globe} label="Domain" value={lead.domain} />
            )}
            {lead.title && (
              <InfoRow icon={User} label="Title" value={lead.title} />
            )}
            {lead.linkedin && (
              <InfoRow icon={Linkedin} label="LinkedIn" value={lead.linkedin} />
            )}
            {lead.resend_message_id && (
              <InfoRow icon={Hash} label="Resend ID" value={lead.resend_message_id} accent />
            )}
          </div>
        </div>

        {/* Candidate emails */}
        {lead.candidate_emails.length > 0 && (
          <div className="px-6 py-4 border-b border-stone-800">
            <h3 className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-3">
              Candidate Emails
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {lead.candidate_emails.map((e) => (
                <span
                  key={e}
                  className={cn(
                    "text-xs px-2 py-1 rounded-md",
                    e === lead.verified_email
                      ? "bg-emerald-900/40 text-emerald-300 border border-emerald-800/60"
                      : "bg-stone-900 text-stone-400 border border-stone-800",
                  )}
                >
                  {e === lead.verified_email && "✓ "}
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Research */}
        {lead.research && (
          <div className="px-6 py-4 border-b border-stone-800">
            <h3 className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-3">
              Research
            </h3>
            <pre className="text-xs whitespace-pre-wrap text-stone-400 bg-stone-900/50 rounded-lg p-3 border border-stone-800">
              {JSON.stringify(lead.research, null, 2)}
            </pre>
          </div>
        )}

        {/* Draft */}
        <div className="px-6 py-4 border-b border-stone-800">
          <h3 className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-3">
            Draft Email
          </h3>
          {lead.draft_subject ? (
            <div className="bg-stone-900/50 rounded-lg border border-stone-800 p-4">
              <div className="text-xs text-stone-500 mb-1">Subject</div>
              <div className="font-semibold text-sm text-stone-200 mb-3">{lead.draft_subject}</div>
              <div className="text-xs text-stone-500 mb-1">Body</div>
              <pre className="whitespace-pre-wrap text-sm text-stone-300 leading-relaxed">
                {lead.draft_body}
              </pre>
            </div>
          ) : streamingDraft ? (
            <div className="bg-stone-900/50 rounded-lg border border-coral-800/40 p-4">
              <pre className="whitespace-pre-wrap text-sm text-coral-200 leading-relaxed">
                {streamingDraft}
                <span className="animate-pulse text-coral-400">▌</span>
              </pre>
            </div>
          ) : (
            <div className="text-stone-600 text-sm">Not yet drafted</div>
          )}
        </div>
      </div>

      {/* Log stream pinned to bottom */}
      <div className="shrink-0 border-t border-stone-800">
        <div className="px-4 py-2 flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
            Pipeline Log
          </h3>
          <span className="text-[10px] text-stone-600">
            {mergedEvents.length} events
          </span>
        </div>
        <LogStream events={mergedEvents} heightClass="h-[200px]" />
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-3.5 h-3.5 text-stone-600 shrink-0" />
      <span className="text-stone-500 shrink-0">{label}</span>
      <span
        className={cn(
          "truncate",
          accent ? "text-coral-400" : "text-stone-300",
        )}
      >
        {value}
      </span>
    </div>
  );
}
