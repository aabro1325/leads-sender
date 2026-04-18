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
    <div className="flex gap-1.5">
      {STEPS.map((s) => {
        const hasEvents = stepsWithEvents.has(s);
        const isActive = s === active && !isDone;
        const errored =
          (isDead && s === "verify") ||
          events.some((e) => e.step === s && e.level === "error");
        const done = hasEvents && !isActive && !errored;
        return (
          <span
            key={s}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-medium uppercase tracking-wide",
              errored
                ? "bg-red-950/60 border-red-900 text-red-300"
                : done
                  ? "bg-emerald-950/40 border-emerald-900 text-emerald-300"
                  : isActive
                    ? "bg-coral-950 border-coral-800 text-coral-200"
                    : "bg-stone-900 border-stone-800 text-stone-500",
            )}
          >
            {errored ? (
              <X className="w-3 h-3" />
            ) : isActive ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : done ? (
              <Check className="w-3 h-3" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
            {s}
          </span>
        );
      })}
    </div>
  );
}
