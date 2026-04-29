import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Star,
} from "lucide-react";
import {
  getGetInterviewSessionQueryKey,
  getListInterviewSessionsQueryKey,
  useGetInterviewSession,
  useSubmitInterviewAnswer,
  type InterviewAnswer,
  type InterviewFeedback,
  type InterviewSessionDetail,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Props = {
  sessionId: string;
  initialDetail?: InterviewSessionDetail;
  onBack: () => void;
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-card-foreground">{value} / 5</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-chart-4 transition-all"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: InterviewFeedback }) {
  return (
    <div className="rounded-xl border border-chart-4/30 bg-chart-4/5 p-4 space-y-4">
      <div className="flex items-center gap-2 text-chart-4">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-semibold">AI feedback</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <ScoreBar label="Clarity" value={feedback.clarity} />
        <ScoreBar label="Structure" value={feedback.structure} />
        <ScoreBar label="Specificity" value={feedback.specificity} />
      </div>
      <p className="text-sm text-card-foreground leading-relaxed">
        {feedback.summary}
      </p>
      {feedback.strengths.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Strengths
          </div>
          <ul className="text-sm text-card-foreground space-y-1 list-disc list-inside">
            {feedback.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {feedback.improvements.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            What to improve
          </div>
          <ul className="text-sm text-card-foreground space-y-1 list-disc list-inside">
            {feedback.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SessionRunner({ sessionId, initialDetail, onBack }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetInterviewSession(sessionId, {
    query: {
      queryKey: getGetInterviewSessionQueryKey(sessionId),
      initialData: initialDetail,
    },
  });

  const session = data?.session;
  const questions = data?.questions ?? [];
  const answers = data?.answers ?? [];

  const answerByQuestion = useMemo(() => {
    const map = new Map<string, InterviewAnswer>();
    for (const a of answers) map.set(a.questionId, a);
    return map;
  }, [answers]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState("");

  const activeQuestion = questions[activeIndex];
  const activeAnswer = activeQuestion
    ? answerByQuestion.get(activeQuestion.id)
    : undefined;

  // When the active question changes, sync draft with saved answer body.
  useEffect(() => {
    setDraft(activeAnswer?.body ?? "");
  }, [activeIndex, activeAnswer?.id, activeAnswer?.body]);

  const submitMutation = useSubmitInterviewAnswer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetInterviewSessionQueryKey(sessionId),
        });
        queryClient.invalidateQueries({
          queryKey: getListInterviewSessionsQueryKey(),
        });
      },
      onError: () => {
        toast({
          title: "Could not get feedback",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      },
    },
  });

  const submitting = submitMutation.isPending;

  const handleSubmit = () => {
    if (!activeQuestion) return;
    if (draft.trim().length === 0) return;
    submitMutation.mutate({
      id: sessionId,
      data: { questionId: activeQuestion.id, body: draft.trim() },
    });
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!session || !activeQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Session not found.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  const answeredCount = answers.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> All sessions
          </Button>
          <h2 className="text-2xl font-semibold text-foreground">
            {session.role}
            {session.company ? (
              <span className="text-muted-foreground font-normal">
                {" "}
                · {session.company}
              </span>
            ) : null}
          </h2>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{session.level}</Badge>
            <Badge variant="secondary">{session.focus}</Badge>
            <span>
              {answeredCount} of {questions.length} answered
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Questions
          </div>
          <div className="space-y-1">
            {questions.map((q, i) => {
              const answered = answerByQuestion.has(q.id);
              const isActive = i === activeIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveIndex(i)}
                  className={`w-full text-left rounded-lg p-2 text-sm transition-colors flex items-start gap-2 ${
                    isActive
                      ? "bg-chart-4/10 text-card-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {answered ? (
                      <CheckCircle2 className="h-4 w-4 text-chart-4" />
                    ) : (
                      <span
                        className={`inline-block h-4 w-4 rounded-full border ${isActive ? "border-chart-4" : "border-border"}`}
                      />
                    )}
                  </span>
                  <span className="line-clamp-2">
                    <span className="font-medium mr-1">Q{i + 1}.</span>
                    {q.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <Badge variant="outline">{activeQuestion.type}</Badge>
              <span className="text-xs text-muted-foreground">
                Question {activeIndex + 1} of {questions.length}
              </span>
            </div>
            <p className="text-lg font-medium text-card-foreground leading-relaxed">
              {activeQuestion.text}
            </p>
            {activeQuestion.starHint ? (
              <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground flex items-start gap-2">
                <Star className="h-4 w-4 shrink-0 mt-0.5 text-chart-4" />
                <span>{activeQuestion.starHint}</span>
              </div>
            ) : null}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="ip-answer"
                className="text-sm font-semibold text-card-foreground"
              >
                Your answer
              </label>
              <span className="text-xs text-muted-foreground">
                {draft.length} chars
              </span>
            </div>
            <Textarea
              id="ip-answer"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                activeQuestion.type === "Behavioral"
                  ? "Try the STAR framework: Situation, Task, Action, Result."
                  : "Walk through your reasoning, trade-offs, and example."
              }
              rows={8}
              className="resize-y"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeIndex >= questions.length - 1}
                  onClick={() =>
                    setActiveIndex((i) => Math.min(questions.length - 1, i + 1))
                  }
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting || draft.trim().length === 0}
                
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reviewing…
                  </>
                ) : activeAnswer ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Re-review
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Get AI feedback
                  </>
                )}
              </Button>
            </div>
          </div>

          {activeAnswer?.feedback ? (
            <FeedbackCard feedback={activeAnswer.feedback} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
