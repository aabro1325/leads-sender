"use client";
import { useEffect, useRef, useState } from "react";
import type { LeadEvent } from "./types";

export function useSSE(path: string) {
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(path);
    esRef.current = es;
    es.addEventListener("lead", (e) => {
      try {
        const parsed = JSON.parse((e as MessageEvent).data) as LeadEvent;
        setEvents((prev) => [...prev, parsed]);
      } catch {}
    });
    es.onerror = () => {
      /* auto-reconnects */
    };
    return () => es.close();
  }, [path]);

  return events;
}
