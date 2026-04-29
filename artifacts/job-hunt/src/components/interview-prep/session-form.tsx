import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  useCreateInterviewSession,
  useListApplications,
  type CreateInterviewSessionRequest,
  type InterviewSessionDetail,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Props = {
  onCreated: (detail: InterviewSessionDetail) => void;
};

const LEVELS: CreateInterviewSessionRequest["level"][] = [
  "Intern",
  "Junior",
  "Mid",
  "Senior",
  "Staff",
];

const FOCUS_OPTIONS: {
  value: CreateInterviewSessionRequest["focus"];
  label: string;
  helper: string;
}[] = [
  {
    value: "Behavioral",
    label: "Behavioral",
    helper: "Storytelling, teamwork, conflict, leadership.",
  },
  {
    value: "Technical",
    label: "Technical",
    helper: "Role-specific concepts and trade-offs.",
  },
  {
    value: "Mixed",
    label: "Mixed",
    helper: "An even split of behavioral and technical.",
  },
];

const NO_APP = "__none";

export function SessionForm({ onCreated }: Props) {
  const { toast } = useToast();

  const { data: appList, isLoading: appsLoading } = useListApplications();
  const applications = appList?.applications ?? [];

  const [role, setRole] = useState("");
  const [level, setLevel] = useState<CreateInterviewSessionRequest["level"]>(
    "Mid",
  );
  const [focus, setFocus] = useState<CreateInterviewSessionRequest["focus"]>(
    "Mixed",
  );
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [applicationId, setApplicationId] = useState<string>(NO_APP);

  const selectedApp = useMemo(
    () => applications.find((a) => a.id === applicationId),
    [applications, applicationId],
  );

  // When the linked application changes, prefill role/company if blank.
  useEffect(() => {
    if (!selectedApp) return;
    setRole((current) => current || selectedApp.role);
    setCompany((current) => current || selectedApp.company);
  }, [selectedApp]);

  const createMutation = useCreateInterviewSession({
    mutation: {
      onSuccess: (detail) => {
        toast({
          title: "Session ready",
          description: `${detail.questions.length} questions generated.`,
        });
        onCreated(detail);
      },
      onError: () => {
        toast({
          title: "Could not generate questions",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      },
    },
  });

  const submitting = createMutation.isPending;
  const canSubmit = role.trim().length > 0 && !submitting;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    createMutation.mutate({
      data: {
        role: role.trim(),
        level,
        focus,
        company: company.trim() ? company.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
        applicationId: applicationId === NO_APP ? null : applicationId,
        questionCount,
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-chart-4/10 text-chart-4 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">
            Start a new practice session
          </h2>
          <p className="text-sm text-muted-foreground">
            Tell us about the role and we'll generate a tailored set of questions.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ip-application">Link to application (optional)</Label>
          <Select
            value={applicationId}
            onValueChange={setApplicationId}
            disabled={appsLoading}
          >
            <SelectTrigger id="ip-application">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_APP}>None</SelectItem>
              {applications.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.role} — {app.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ip-role">Role *</Label>
          <Input
            id="ip-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ip-level">Level</Label>
          <Select
            value={level}
            onValueChange={(v) =>
              setLevel(v as CreateInterviewSessionRequest["level"])
            }
          >
            <SelectTrigger id="ip-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ip-company">Company (optional)</Label>
          <Input
            id="ip-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Focus</Label>
        <div className="grid sm:grid-cols-3 gap-2">
          {FOCUS_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setFocus(opt.value)}
              className={`text-left rounded-xl border p-3 transition-all ${
                focus === opt.value
                  ? "border-chart-4 bg-chart-4/5 ring-1 ring-chart-4"
                  : "border-border hover:border-chart-4/50"
              }`}
              aria-pressed={focus === opt.value}
            >
              <div className="font-medium text-sm text-card-foreground">
                {opt.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {opt.helper}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ip-count">
            Number of questions ({questionCount})
          </Label>
          <input
            id="ip-count"
            type="range"
            min={3}
            max={10}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full accent-chart-4"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ip-notes">Anything specific to focus on?</Label>
          <Textarea
            id="ip-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. system design at scale, recent project on payments..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          disabled={!canSubmit}
          
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating
              questions…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Generate questions
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
