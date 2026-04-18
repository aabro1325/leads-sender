"use client";
import { useEffect, useRef } from "react";
import type { LeadEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LogStream({
  events,
  heightClass = "h-96",
}: {
  events: LeadEvent[];
  heightClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [events.length]);

  return (
    <div
      ref={ref}
      className={cn(
        "font-mono text-[11px] bg-stone-950 overflow-auto",
        heightClass,
      )}
    >
      {events.length === 0 && (
        <div className="px-4 py-3 text-stone-600">Waiting for events...</div>
      )}
      {events.map((e, i) => (
        <div
          key={i}
          className={cn(
            "px-4 py-0.5 flex gap-3 leading-5 border-b border-stone-900/60",
            e.level === "error" && "text-red-400 bg-red-950/20",
            e.level === "warn" && "text-amber-300",
            e.level === "info" && "text-stone-400",
          )}
        >
          <span className="text-stone-600 shrink-0">
            {new Date(e.ts).toLocaleTimeString()}
          </span>
          <span className="text-stone-500 shrink-0 w-16 truncate">{e.step}</span>
          <span className="text-stone-600 shrink-0 w-14 truncate">
            {e.lead_id.slice(0, 8)}
          </span>
          <span className="flex-1 whitespace-pre-wrap break-words">
            {e.message}
            {e.data && e.step !== "draft" && (
              <span className="text-stone-700">
                {" "}
                {JSON.stringify(e.data).slice(0, 200)}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
