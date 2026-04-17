"use client";
import { Check, Circle, Loader2, X } from "lucide-react";
import { STEPS, type LeadEvent, type LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_TO_STEP: Record<LeadStatus, string> = {
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

export function StepTimeline({
  status,
  events,
}: {
  status: LeadStatus;
  events: LeadEvent[];
}) {
  const active = STATUS_TO_STEP[status];
  const stepsWithEvents = new Set(events.map((e) => e.step));
  const isDead = status === "DEAD";
  const isDone = status === "SENT";

  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((s) => {
        const hasEvents = stepsWithEvents.has(s);
        const isActive = s === active && !isDone;
        const errored =
          (isDead && s === "verify") ||
          events.some((e) => e.step === s && e.level === "error");
        const done = hasEvents && !isActive && !errored;
        return (
          <li
            key={s}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs",
              errored
                ? "bg-red-950/60 border-red-900 text-red-200"
                : done
                ? "bg-emerald-950/40 border-emerald-900 text-emerald-200"
                : isActive
                ? "bg-violet-950/60 border-violet-800 text-violet-100"
                : "bg-zinc-900 border-zinc-800 text-zinc-400",
            )}
          >
            {errored ? (
              <X className="w-3.5 h-3.5" />
            ) : isActive ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : done ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Circle className="w-3.5 h-3.5" />
            )}
            <span className="capitalize">{s}</span>
          </li>
        );
      })}
    </ol>
  );
}
