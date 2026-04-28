import { Mic, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InterviewPrep() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Mic className="h-8 w-8 text-chart-4" /> Interview Prep
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Practice answering questions in a low-pressure environment.
          </p>
        </div>
        <Button className="shrink-0" disabled variant="secondary">
          <Play className="mr-2 h-4 w-4" /> Start Mock Session
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-16 w-16 bg-chart-4/10 text-chart-4 rounded-full flex items-center justify-center mb-6">
          <Mic className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-card-foreground">Build your confidence</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Soon you'll be able to review structured prompts, record your answers, and refine your storytelling before stepping into the real interview room.
        </p>
      </div>
    </div>
  );
}
