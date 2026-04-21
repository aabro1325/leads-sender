import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_COLORS: Record<string, string> = {
  QUEUED: "bg-stone-700 text-stone-400",
  PENDING: "bg-stone-700 text-stone-200",
  NORMALIZING: "bg-amber-900/80 text-amber-200",
  PERMUTING: "bg-amber-900/80 text-amber-200",
  VERIFYING: "bg-yellow-900/80 text-yellow-200",
  VERIFIED: "bg-emerald-900/80 text-emerald-200",
  DEAD: "bg-stone-800 text-stone-500",
  RESEARCHING: "bg-coral-900 text-coral-200",
  DRAFTING: "bg-coral-900 text-coral-200",
  SENDING: "bg-blue-900/80 text-blue-200",
  SENT: "bg-emerald-800 text-white",
  FAILED: "bg-red-900/80 text-red-200",
};
