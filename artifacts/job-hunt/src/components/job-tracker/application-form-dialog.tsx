import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useCreateApplication,
  useUpdateApplication,
  type JobApplication,
  type JobApplicationStatus,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { STAGE_ORDER } from "./utils";

type FormState = {
  company: string;
  role: string;
  link: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  source: string;
  status: JobApplicationStatus;
};

const EMPTY: FormState = {
  company: "",
  role: "",
  link: "",
  location: "",
  salaryMin: "",
  salaryMax: "",
  source: "",
  status: "Saved",
};

function fromApplication(app: JobApplication): FormState {
  return {
    company: app.company,
    role: app.role,
    link: app.link ?? "",
    location: app.location ?? "",
    salaryMin: app.salaryMin ?? "",
    salaryMax: app.salaryMax ?? "",
    source: app.source ?? "",
    status: app.status,
  };
}

function toPayload(state: FormState) {
  const trim = (v: string) => v.trim();
  return {
    company: trim(state.company),
    role: trim(state.role),
    link: trim(state.link) || null,
    location: trim(state.location) || null,
    salaryMin: trim(state.salaryMin) || null,
    salaryMax: trim(state.salaryMax) || null,
    source: trim(state.source) || null,
    status: state.status,
  };
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  mode,
  application,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  application?: JobApplication;
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const [state, setState] = useState<FormState>(
    application ? fromApplication(application) : EMPTY,
  );

  useEffect(() => {
    if (open) {
      setState(application ? fromApplication(application) : EMPTY);
    }
  }, [open, application]);

  const createMutation = useCreateApplication({
    mutation: {
      onSuccess: () => {
        toast({ title: "Application added" });
        onSaved?.();
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Could not save",
          description: "Please check the fields and try again.",
          variant: "destructive",
        });
      },
    },
  });

  const updateMutation = useUpdateApplication({
    mutation: {
      onSuccess: () => {
        toast({ title: "Application updated" });
        onSaved?.();
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Could not save",
          description: "Please check the fields and try again.",
          variant: "destructive",
        });
      },
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isValid = state.company.trim().length > 0 && state.role.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    const payload = toPayload(state);
    if (mode === "create") {
      createMutation.mutate({ data: payload });
    } else if (application) {
      updateMutation.mutate({ id: application.id, data: payload });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add application" : "Edit application"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Capture a new role you're considering or have applied to."
              : "Update the details for this application."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company" required>
              <Input
                value={state.company}
                onChange={(e) =>
                  setState((s) => ({ ...s, company: e.target.value }))
                }
                placeholder="Acme Co."
                required
              />
            </Field>
            <Field label="Role" required>
              <Input
                value={state.role}
                onChange={(e) =>
                  setState((s) => ({ ...s, role: e.target.value }))
                }
                placeholder="Senior Engineer"
                required
              />
            </Field>
          </div>

          <Field label="Posting link">
            <Input
              type="url"
              value={state.link}
              onChange={(e) =>
                setState((s) => ({ ...s, link: e.target.value }))
              }
              placeholder="https://"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Location">
              <Input
                value={state.location}
                onChange={(e) =>
                  setState((s) => ({ ...s, location: e.target.value }))
                }
                placeholder="Remote · NYC"
              />
            </Field>
            <Field label="Source">
              <Input
                value={state.source}
                onChange={(e) =>
                  setState((s) => ({ ...s, source: e.target.value }))
                }
                placeholder="LinkedIn, referral…"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Salary min">
              <Input
                value={state.salaryMin}
                onChange={(e) =>
                  setState((s) => ({ ...s, salaryMin: e.target.value }))
                }
                placeholder="$120k"
              />
            </Field>
            <Field label="Salary max">
              <Input
                value={state.salaryMax}
                onChange={(e) =>
                  setState((s) => ({ ...s, salaryMax: e.target.value }))
                }
                placeholder="$150k"
              />
            </Field>
          </div>

          <Field label="Stage">
            <Select
              value={state.status}
              onValueChange={(value) =>
                setState((s) => ({ ...s, status: value as JobApplicationStatus }))
              }
            >
              <SelectTrigger>
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
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "create" ? (
                "Add application"
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
