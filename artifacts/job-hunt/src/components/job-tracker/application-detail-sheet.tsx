import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
import {
  getGetApplicationQueryKey,
  getGetPipelineSummaryQueryKey,
  getListApplicationsQueryKey,
  useCreateApplicationNote,
  useDeleteApplicationNote,
  useGetApplication,
  useUpdateApplication,
  type JobApplication,
  type JobApplicationStatus,
} from "@workspace/api-client-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  STAGE_ORDER,
  stageBadgeClasses,
  formatDateTime,
  formatRelativeTime,
} from "./utils";

export function ApplicationDetailSheet({
  applicationId,
  open,
  onOpenChange,
  onApplicationChanged,
  onEdit,
  onDelete,
}: {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationChanged?: () => void;
  onEdit: (app: JobApplication) => void;
  onDelete: (app: JobApplication) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [noteDraft, setNoteDraft] = useState("");

  const { data, isLoading } = useGetApplication(applicationId ?? "", {
    query: {
      enabled: !!applicationId && open,
      queryKey: getGetApplicationQueryKey(applicationId ?? ""),
    },
  });

  const invalidateAll = () => {
    if (applicationId) {
      queryClient.invalidateQueries({
        queryKey: getGetApplicationQueryKey(applicationId),
      });
    }
    queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
    queryClient.invalidateQueries({
      queryKey: getGetPipelineSummaryQueryKey(),
    });
    onApplicationChanged?.();
  };

  const updateMutation = useUpdateApplication({
    mutation: {
      onSuccess: invalidateAll,
      onError: () =>
        toast({
          title: "Could not update",
          description: "Please try again.",
          variant: "destructive",
        }),
    },
  });

  const createNoteMutation = useCreateApplicationNote({
    mutation: {
      onSuccess: () => {
        setNoteDraft("");
        invalidateAll();
      },
      onError: () =>
        toast({
          title: "Could not add note",
          description: "Please try again.",
          variant: "destructive",
        }),
    },
  });

  const deleteNoteMutation = useDeleteApplicationNote({
    mutation: {
      onSuccess: invalidateAll,
      onError: () =>
        toast({
          title: "Could not delete note",
          description: "Please try again.",
          variant: "destructive",
        }),
    },
  });

  const application = data?.application;
  const notes = data?.notes ?? [];

  const handleStageChange = (next: JobApplicationStatus) => {
    if (!application || application.status === next) return;
    updateMutation.mutate({ id: application.id, data: { status: next } });
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !noteDraft.trim()) return;
    createNoteMutation.mutate({
      id: application.id,
      data: { body: noteDraft.trim() },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          {isLoading || !application ? (
            <>
              <SheetTitle>
                <Skeleton className="h-6 w-48" />
              </SheetTitle>
              <SheetDescription>
                <Skeleton className="h-4 w-32 mt-1" />
              </SheetDescription>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="text-xl flex items-center gap-2 flex-wrap">
                    {application.role}
                    {application.link && (
                      <a
                        href={application.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </SheetTitle>
                  <SheetDescription className="text-sm">
                    {application.company}
                    {application.source ? ` · via ${application.source}` : ""}
                  </SheetDescription>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                {application.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {application.location}
                  </span>
                )}
                {(application.salaryMin || application.salaryMax) && (
                  <span>
                    {[application.salaryMin, application.salaryMax]
                      .filter(Boolean)
                      .join(" – ")}
                  </span>
                )}
                <span>
                  Updated {formatRelativeTime(application.updatedAt)}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stageBadgeClasses(application.status)}`}
                >
                  {application.status}
                </span>
                <Select
                  value={application.status}
                  onValueChange={(value) =>
                    handleStageChange(value as JobApplicationStatus)
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger className="w-[160px] h-8 ml-1 text-xs">
                    <SelectValue placeholder="Move to…" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_ORDER.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        Move to {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(application)}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(application)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Notes &amp; activity
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notes yet. Capture call summaries, follow-ups, or anything
              you'd like to remember.
            </p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl border border-border bg-muted/30 p-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {note.body}
                    </p>
                    <button
                      onClick={() => {
                        if (!application) return;
                        deleteNoteMutation.mutate({
                          id: application.id,
                          noteId: note.id,
                        });
                      }}
                      disabled={deleteNoteMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDateTime(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={handleSubmitNote}
          className="p-4 border-t border-border bg-card/50"
        >
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Log a conversation, follow-up, or thought…"
            rows={3}
            disabled={!application}
            className="resize-none"
          />
          <div className="flex justify-end mt-2">
            <Button
              type="submit"
              size="sm"
              disabled={
                !application ||
                !noteDraft.trim() ||
                createNoteMutation.isPending
              }
            >
              {createNoteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" /> Add note
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
