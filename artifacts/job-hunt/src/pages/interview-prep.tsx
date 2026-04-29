import { useState } from "react";
import { Mic } from "lucide-react";
import type {
  InterviewSession,
  InterviewSessionDetail,
} from "@workspace/api-client-react";

import { SessionForm } from "@/components/interview-prep/session-form";
import { SessionsHistory } from "@/components/interview-prep/sessions-history";
import { SessionRunner } from "@/components/interview-prep/session-runner";

type ActiveSession = {
  id: string;
  initialDetail?: InterviewSessionDetail;
};

export default function InterviewPrep() {
  const [active, setActive] = useState<ActiveSession | null>(null);

  if (active) {
    return (
      <SessionRunner
        sessionId={active.id}
        initialDetail={active.initialDetail}
        onBack={() => setActive(null)}
      />
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Mic className="h-8 w-8 text-chart-4" /> Interview Prep
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Generate tailored questions, write answers, and get AI feedback.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <SessionForm
          onCreated={(detail) =>
            setActive({ id: detail.session.id, initialDetail: detail })
          }
        />
        <SessionsHistory
          onOpen={(s: InterviewSession) => setActive({ id: s.id })}
        />
      </div>
    </div>
  );
}
