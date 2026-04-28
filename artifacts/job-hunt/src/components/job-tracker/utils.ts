import type { JobApplicationStatus } from "@workspace/api-client-react";

export const STAGE_ORDER: JobApplicationStatus[] = [
  "Saved",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
];

export function stageBadgeClasses(stage: JobApplicationStatus): string {
  switch (stage) {
    case "Saved":
      return "bg-muted text-muted-foreground border-border";
    case "Applied":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20";
    case "Interviewing":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20";
    case "Offer":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20";
    case "Rejected":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20";
  }
}

export function stageAccentClasses(stage: JobApplicationStatus): string {
  switch (stage) {
    case "Saved":
      return "bg-muted-foreground/10 text-muted-foreground";
    case "Applied":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-300";
    case "Interviewing":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "Offer":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "Rejected":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }
}

export function formatRelativeTime(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function formatDateTime(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
