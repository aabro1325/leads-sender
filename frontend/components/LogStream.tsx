"use client";
import { useEffect, useRef } from "react";
import type { LeadEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LogStream({ events, heightClass = "h-96" }: { events: LeadEvent[]; heightClass?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [events.length]);

  return (
    <div
      ref={ref}
      className={cn(
        "font-mono text-xs bg-black/60 border border-zinc-800 rounded-lg overflow-auto",
        heightClass,
      )}
    >
      {events.length === 0 && (
        <div className="p-4 text-zinc-500">Waiting for events…</div>
      )}
      {events.map((e, i) => (
        <div
          key={i}
          className={cn(
            "px-3 py-1 border-b border-zinc-900/70 flex gap-3",
            e.level === "error" && "text-red-400",
            e.level === "warn" && "text-amber-300",
            e.level === "info" && "text-zinc-300",
          )}
        >
          <span className="text-zinc-600 shrink-0">
            {new Date(e.ts).toLocaleTimeString()}
          </span>
          <span className="text-zinc-500 shrink-0 w-20 truncate">{e.step}</span>
          <span className="text-zinc-600 shrink-0 w-20 truncate">
            {e.lead_id.slice(0, 8)}
          </span>
          <span className="flex-1 whitespace-pre-wrap break-words">
            {e.message}
            {e.data && e.step !== "draft" && (
              <span className="text-zinc-600">
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
