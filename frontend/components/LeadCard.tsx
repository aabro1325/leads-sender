"use client";
import { Check, Circle, Clock, Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Lead, LeadStatus } from "@/lib/types";
import { STEPS } from "@/lib/types";
import { retryLead } from "@/lib/api";
import { cn, STATUS_COLORS } from "@/lib/utils";

const STATUS_TO_STEP: Record<LeadStatus, string> = {
  QUEUED: "",
  PENDING: "",
  NORMALIZING: "normalize",
  PERMUTING: "permute",
  VERIFYING: "verify",
  VERIFIED: "verify",
  DEAD: "verify",
  RESEARCHING: "research",
  DRAFTING: "draft",
  SENDING: "send",
  SENT: "send",
  FAILED: "",
};

const STEP_COLORS: Record<string, { active: string; done: string; error: string }> = {
  normalize: { active: "bg-amber-800", done: "bg-emerald-800", error: "bg-red-800" },
  permute: { active: "bg-amber-800", done: "bg-emerald-800", error: "bg-red-800" },
  verify: { active: "bg-yellow-800", done: "bg-emerald-800", error: "bg-red-800" },
  research: { active: "bg-coral-800", done: "bg-emerald-800", error: "bg-red-800" },
  draft: { active: "bg-coral-800", done: "bg-emerald-800", error: "bg-red-800" },
  send: { active: "bg-blue-800", done: "bg-emerald-800", error: "bg-red-800" },
};

export function LeadRow({
  lead,
  selected,
  onClick,
  onDelete,
  queuePosition,
}: {
  lead: Lead;
  selected: boolean;
  onClick: () => void;
  onDelete?: (id: string) => void;
  queuePosition?: number;
}) {
  const [retrying, setRetrying] = useState(false);
  const name =
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown lead";
  const activeStep = STATUS_TO_STEP[lead.status];
  const isQueued = lead.status === "QUEUED";
  const isDead = lead.status === "DEAD";
  const isDone = lead.status === "SENT";
  const isFailed = lead.status === "FAILED";
  const stepsWithEvents = new Set((lead.events ?? []).map((e) => e.step));

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative w-full text-left px-4 py-3 border-b border-stone-800/60 transition-colors cursor-pointer",
        selected ? "bg-stone-800/70" : "hover:bg-stone-900/60",
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-medium text-sm truncate text-stone-100">{name}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {isQueued && queuePosition != null && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono tabular-nums">
              #{queuePosition}
            </span>
          )}
          <span
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium",
              STATUS_COLORS[lead.status] ?? "bg-stone-800",
            )}
          >
            {lead.status}
          </span>
          {(isFailed || isDead) && (
            <button
              type="button"
              aria-label="Retry lead"
              disabled={retrying}
              onClick={async (e) => {
                e.stopPropagation();
                setRetrying(true);
                try {
                  await retryLead(lead.id);
                } catch (err) {
                  console.error(err);
                } finally {
                  setRetrying(false);
                }
              }}
              className="text-emerald-600 hover:text-emerald-400 transition-colors disabled:opacity-30"
            >
              <RotateCcw className={cn("w-3.5 h-3.5", retrying && "animate-spin")} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label="Delete lead"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete lead "${name}"?`)) {
                  onDelete(lead.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-stone-500 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="text-stone-500 text-xs truncate mb-2">
        {lead.title || ""} {lead.company && `at ${lead.company}`}
      </div>
      <div className="flex gap-1">
        {isQueued ? (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-stone-800 text-stone-500">
            <Clock className="w-2.5 h-2.5" />
            waiting in queue
          </span>
        ) : (STEPS.map((s) => {
          const hasEvents = stepsWithEvents.has(s);
          const isActive = s === activeStep && !isDone;
          const errored =
            (isDead && s === "verify") ||
            (isFailed && s === activeStep) ||
            (lead.events ?? []).some((e) => e.step === s && e.level === "error");
          const done = hasEvents && !isActive && !errored;

          const color = errored
            ? STEP_COLORS[s]?.error ?? "bg-red-800"
            : done
              ? STEP_COLORS[s]?.done ?? "bg-emerald-800"
              : isActive
                ? STEP_COLORS[s]?.active ?? "bg-coral-800"
                : "bg-stone-800";

          return (
            <span
              key={s}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium",
                color,
                errored
                  ? "text-red-200"
                  : done
                    ? "text-emerald-200"
                    : isActive
                      ? "text-white"
                      : "text-stone-600",
              )}
            >
              {errored ? (
                <X className="w-2.5 h-2.5" />
              ) : isActive ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : done ? (
                <Check className="w-2.5 h-2.5" />
              ) : (
                <Circle className="w-2.5 h-2.5" />
              )}
              {s}
            </span>
          );
        }))}
      </div>
    </div>
  );
}
