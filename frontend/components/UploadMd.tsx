"use client";
import { useState } from "react";
import { createLead } from "@/lib/api";

export function UploadMd({ onCreated }: { onCreated: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await createLead(text);
      setText("");
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  async function onFile(files: FileList | null) {
    if (!files) return;
    const all = await Promise.all(Array.from(files).map((f) => f.text()));
    setBusy(true);
    try {
      for (const md of all) {
        await createLead(md);
      }
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files);
        }}
        className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-4"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste free-form lead notes here, or drop .md files onto this box…"
          className="w-full bg-transparent outline-none resize-none text-sm min-h-[120px]"
        />
        <div className="flex items-center justify-between gap-2 mt-2">
          <input
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            multiple
            onChange={(e) => onFile(e.target.files)}
            className="text-xs text-zinc-400"
          />
          <button
            disabled={busy || !text.trim()}
            onClick={submit}
            className="px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-sm"
          >
            {busy ? "Queuing…" : "Send to pipeline"}
          </button>
        </div>
      </div>
    </div>
  );
}
