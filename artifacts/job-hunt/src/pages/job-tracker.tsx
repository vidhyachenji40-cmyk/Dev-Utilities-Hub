import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobTracker() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" /> Job Tracker
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Keep your applications organized across all stages of the pipeline.
          </p>
        </div>
        <Button className="shrink-0" disabled>
          <Plus className="mr-2 h-4 w-4" /> Add Application
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <Briefcase className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-card-foreground">Your pipeline is coming together</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Soon you'll be able to log new applications, move them through stages like "Interviewing" or "Offer", and keep all your notes in one calm, organized view.
        </p>
      </div>
    </div>
  );
}
