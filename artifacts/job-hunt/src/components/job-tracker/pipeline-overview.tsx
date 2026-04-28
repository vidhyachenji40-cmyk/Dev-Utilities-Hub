import type { PipelineSummary } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  STAGE_ORDER,
  stageAccentClasses,
  formatRelativeTime,
} from "./utils";

export function PipelineOverview({
  summary,
  isLoading,
}: {
  summary: PipelineSummary | undefined;
  isLoading: boolean;
}) {
  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Pipeline overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAGE_ORDER.map((stage) => {
          const count =
            summary?.stages.find((s) => s.status === stage)?.count ?? 0;
          return (
            <div
              key={stage}
              className="bg-card border border-border rounded-2xl p-4 shadow-sm"
            >
              <div
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold mb-2 ${stageAccentClasses(stage)}`}
              >
                {isLoading ? "·" : count}
              </div>
              <div className="text-sm font-medium text-card-foreground">
                {stage}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-card-foreground">
            Recent activity
          </h3>
          <span className="text-xs text-muted-foreground">
            {summary
              ? `${summary.total} total ${summary.total === 1 ? "role" : "roles"}`
              : ""}
          </span>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : summary && summary.recentActivity.length > 0 ? (
          <ul className="divide-y divide-border">
            {summary.recentActivity.map((entry) => (
              <li
                key={entry.applicationId}
                className="py-2 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-card-foreground truncate">
                    {entry.role}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.company} · {entry.status}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeTime(entry.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Activity from your applications will appear here.
          </p>
        )}
      </div>
    </section>
  );
}
