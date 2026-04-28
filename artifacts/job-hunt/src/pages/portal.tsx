import { Link } from "wouter";
import { Briefcase, FileText, Mic, ArrowRight } from "lucide-react";
import type { CurrentUser } from "@workspace/api-client-react";

export default function Portal({ user }: { user?: CurrentUser }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Good morning, {user?.firstName || "there"}.
        </h1>
        <p className="text-muted-foreground text-lg">
          Welcome back to your workspace. What are we focusing on today?
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/app/job-tracker">
          <div className="group cursor-pointer bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground group-hover:text-primary transition-colors">Job Tracker</h3>
            <p className="text-muted-foreground flex-1 mb-6">
              Manage your active applications, upcoming interviews, and follow-ups.
            </p>
            <div className="flex items-center text-sm font-medium text-primary mt-auto">
              Open Workspace <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link href="/app/resume-match">
          <div className="group cursor-pointer bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
            <div className="h-12 w-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground group-hover:text-accent transition-colors">Resume Match</h3>
            <p className="text-muted-foreground flex-1 mb-6">
              Compare your resume against a job description to identify missing keywords.
            </p>
            <div className="flex items-center text-sm font-medium text-accent mt-auto">
              Open Workspace <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link href="/app/interview-prep">
          <div className="group cursor-pointer bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
            <div className="h-12 w-12 bg-chart-4/10 text-chart-4 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-chart-4 group-hover:text-white transition-all duration-300">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground group-hover:text-chart-4 transition-colors">Interview Prep</h3>
            <p className="text-muted-foreground flex-1 mb-6">
              Practice your answers to behavioral and role-specific questions.
            </p>
            <div className="flex items-center text-sm font-medium text-chart-4 mt-auto">
              Open Workspace <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
