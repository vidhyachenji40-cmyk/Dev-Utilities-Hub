import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResumeMatch() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-accent" /> Resume Match
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Tailor your resume for the perfect fit.
          </p>
        </div>
        <Button className="shrink-0" disabled variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Upload Base Resume
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-16 w-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-6">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-card-foreground">Optimize your profile</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          In the future, you'll be able to paste a job description, select your resume, and get an instant breakdown of missing keywords and fit score suggestions.
        </p>
      </div>
    </div>
  );
}
