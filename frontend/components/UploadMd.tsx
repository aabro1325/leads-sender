"use client";
import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createLead } from "@/lib/api";

export function UploadMd({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await createLead(text);
      setText("");
      setOpen(false);
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
      setOpen(false);
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="px-4 pb-3 flex gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-coral-600 hover:bg-coral-500 text-sm font-medium transition-colors text-white"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm transition-colors text-stone-300"
        >
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          multiple
          onChange={(e) => onFile(e.target.files)}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      className="px-4 pb-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onFile(e.dataTransfer.files);
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste lead notes..."
        autoFocus
        className="w-full bg-stone-900 border border-stone-700 rounded-lg outline-none resize-none text-sm p-3 min-h-[100px] focus:border-coral-600 transition-colors text-stone-200 placeholder:text-stone-600"
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={() => {
            setOpen(false);
            setText("");
          }}
          className="px-3 py-1.5 rounded-md text-sm text-stone-400 hover:text-stone-200"
        >
          Cancel
        </button>
        <button
          disabled={busy || !text.trim()}
          onClick={submit}
          className="px-3 py-1.5 rounded-md bg-coral-600 hover:bg-coral-500 disabled:opacity-40 text-sm font-medium text-white"
        >
          {busy ? "Queuing..." : "Send to pipeline"}
        </button>
      </div>
    </div>
  );
}
