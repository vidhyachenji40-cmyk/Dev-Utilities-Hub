import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import {
  getGetPipelineSummaryQueryKey,
  getListApplicationsQueryKey,
  useDeleteApplication,
  useListApplications,
  useUpdateApplication,
  useGetPipelineSummary,
  type JobApplication,
  type JobApplicationStatus,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ApplicationFormDialog } from "@/components/job-tracker/application-form-dialog";
import { ApplicationDetailSheet } from "@/components/job-tracker/application-detail-sheet";
import { PipelineOverview } from "@/components/job-tracker/pipeline-overview";
import {
  STAGE_ORDER,
  stageBadgeClasses,
  formatRelativeTime,
} from "@/components/job-tracker/utils";

export default function JobTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<JobApplication | null>(
    null,
  );

  const { data: list, isLoading: listLoading } = useListApplications({
    query: { queryKey: getListApplicationsQueryKey() },
  });
  const { data: summary, isLoading: summaryLoading } = useGetPipelineSummary({
    query: { queryKey: getGetPipelineSummaryQueryKey() },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
    queryClient.invalidateQueries({
      queryKey: getGetPipelineSummaryQueryKey(),
    });
  };

  const updateMutation = useUpdateApplication({
    mutation: {
      onSuccess: () => {
        invalidate();
      },
      onError: () => {
        toast({
          title: "Could not update",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      },
    },
  });

  const deleteMutation = useDeleteApplication({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: "Application removed" });
        setPendingDelete(null);
      },
      onError: () => {
        toast({
          title: "Could not delete",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      },
    },
  });

  const applications = list?.applications ?? [];

  const grouped = useMemo(() => {
    const map = new Map<JobApplicationStatus, JobApplication[]>();
    for (const stage of STAGE_ORDER) map.set(stage, []);
    for (const app of applications) {
      map.get(app.status)?.push(app);
    }
    return map;
  }, [applications]);

  const handleStageChange = (
    application: JobApplication,
    next: JobApplicationStatus,
  ) => {
    if (application.status === next) return;
    updateMutation.mutate({
      id: application.id,
      data: { status: next },
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-6xl mx-auto p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6">
          <Link
            href="/app"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to workspace
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" /> Job Tracker
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Keep your applications organized across all stages of the
              pipeline.
            </p>
          </div>
          <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Application
          </Button>
        </div>

        <PipelineOverview summary={summary} isLoading={summaryLoading} />

        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Your applications
            </h2>
            <span className="text-sm text-muted-foreground">
              {applications.length}{" "}
              {applications.length === 1 ? "role" : "roles"}
            </span>
          </div>

          {listLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <EmptyState onAdd={() => setCreateOpen(true)} />
          ) : (
            <div className="space-y-6">
              {STAGE_ORDER.map((stage) => {
                const items = grouped.get(stage) ?? [];
                if (items.length === 0) return null;
                return (
                  <div key={stage}>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stageBadgeClasses(stage)}`}
                      >
                        {stage}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {items.map((app) => (
                        <ApplicationRow
                          key={app.id}
                          application={app}
                          onOpen={() => setSelectedId(app.id)}
                          onEdit={() => setEditing(app)}
                          onDelete={() => setPendingDelete(app)}
                          onStageChange={(next) =>
                            handleStageChange(app, next)
                          }
                          isUpdating={
                            updateMutation.isPending &&
                            updateMutation.variables?.id === app.id
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ApplicationFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSaved={invalidate}
      />

      {editing && (
        <ApplicationFormDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          mode="edit"
          application={editing}
          onSaved={invalidate}
        />
      )}

      <ApplicationDetailSheet
        applicationId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onApplicationChanged={invalidate}
        onEdit={(app) => {
          setSelectedId(null);
          setEditing(app);
        }}
        onDelete={(app) => {
          setSelectedId(null);
          setPendingDelete(app);
        }}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `This permanently removes ${pendingDelete.role} at ${pendingDelete.company} and all of its notes.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) {
                  deleteMutation.mutate({ id: pendingDelete.id });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
      <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
        <Briefcase className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-card-foreground">
        Start tracking your search
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Log the first role you're considering. You can move it through stages
        and keep notes on every conversation.
      </p>
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" /> Add your first application
      </Button>
    </div>
  );
}

function ApplicationRow({
  application,
  onOpen,
  onEdit,
  onDelete,
  onStageChange,
  isUpdating,
}: {
  application: JobApplication;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStageChange: (next: JobApplicationStatus) => void;
  isUpdating: boolean;
}) {
  const salary =
    application.salaryMin || application.salaryMax
      ? [application.salaryMin, application.salaryMax].filter(Boolean).join(" – ")
      : null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <button
          onClick={onOpen}
          className="flex-1 text-left group"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {application.role}
            </h3>
            {application.link && (
              <a
                href={application.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-primary"
                title="Open posting"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {application.company}
            {application.source ? ` · via ${application.source}` : ""}
          </p>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            {application.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {application.location}
              </span>
            )}
            {salary && <span>{salary}</span>}
            <span>Updated {formatRelativeTime(application.updatedAt)}</span>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={application.status}
            onValueChange={(value) =>
              onStageChange(value as JobApplicationStatus)
            }
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_ORDER.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
