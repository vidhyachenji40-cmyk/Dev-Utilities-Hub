import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, Trash2 } from "lucide-react";
import {
  getListInterviewSessionsQueryKey,
  useDeleteInterviewSession,
  useListInterviewSessions,
  type InterviewSession,
} from "@workspace/api-client-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type Props = {
  onOpen: (session: InterviewSession) => void;
};

function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function SessionsHistory({ onOpen }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<InterviewSession | null>(
    null,
  );

  const { data, isLoading } = useListInterviewSessions({
    query: { queryKey: getListInterviewSessionsQueryKey() },
  });

  const deleteMutation = useDeleteInterviewSession({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListInterviewSessionsQueryKey(),
        });
        toast({ title: "Session deleted" });
        setPendingDelete(null);
      },
      onError: () => {
        toast({
          title: "Could not delete",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const sessions = data?.sessions ?? [];

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-card-foreground">
          Past sessions
        </h2>
        <span className="text-xs text-muted-foreground">
          {sessions.length} total
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          No sessions yet. Start one above to begin practicing.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-chart-4/40 hover:bg-chart-4/5 transition-colors cursor-pointer"
              onClick={() => onOpen(s)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-card-foreground truncate">
                    {s.role}
                  </span>
                  {s.company ? (
                    <span className="text-sm text-muted-foreground truncate">
                      · {s.company}
                    </span>
                  ) : null}
                  <Badge variant="secondary" className="ml-1">
                    {s.level}
                  </Badge>
                  <Badge variant="outline">{s.focus}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatRelative(s.updatedAt)}
                  </span>
                  <span>
                    {s.answeredCount} / {s.questionCount} answered
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDelete(s);
                }}
                aria-label="Delete session"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the session and all of your saved
              answers and feedback. You can't undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (pendingDelete) {
                  deleteMutation.mutate({ id: pendingDelete.id });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                </>
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
