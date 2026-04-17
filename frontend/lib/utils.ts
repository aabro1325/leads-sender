import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-zinc-700 text-zinc-200",
  NORMALIZING: "bg-sky-800 text-sky-100",
  PERMUTING: "bg-sky-800 text-sky-100",
  VERIFYING: "bg-amber-800 text-amber-100",
  VERIFIED: "bg-emerald-800 text-emerald-100",
  DEAD: "bg-zinc-800 text-zinc-500",
  RESEARCHING: "bg-violet-800 text-violet-100",
  DRAFTING: "bg-violet-800 text-violet-100",
  SENDING: "bg-blue-800 text-blue-100",
  SENT: "bg-emerald-700 text-white",
  FAILED: "bg-red-800 text-red-100",
};
