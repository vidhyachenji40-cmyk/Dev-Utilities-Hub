import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Mic } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="px-6 h-16 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2 text-primary">
          <Briefcase className="h-6 w-6" />
          <span className="font-semibold text-lg tracking-tight text-foreground">Job Hunt Toolkit</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors">
            Sign In
          </Link>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary mb-8">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
          Your personal job search companion
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground mb-6 max-w-3xl">
          A calm, organized space for your <span className="text-primary relative whitespace-nowrap">job search<span className="absolute -bottom-2 left-0 w-full h-1 bg-accent/30 rounded-full"></span></span>.
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl">
          Stay on top of applications, tailor your resume for perfect matches, and practice interview questions with confidence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
          <Button asChild size="lg" className="w-full sm:w-auto text-base h-12 px-8 shadow-md">
            <Link href="/sign-up">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base h-12 px-8">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Job Tracker</h3>
            <p className="text-muted-foreground">Keep your applications organized. Know exactly where you stand with every company at a glance.</p>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="h-12 w-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Resume Match</h3>
            <p className="text-muted-foreground">Compare your resume against job descriptions to identify missing keywords and improve your fit score.</p>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="h-12 w-12 bg-chart-4/10 text-chart-4 rounded-xl flex items-center justify-center mb-4">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Interview Prep</h3>
            <p className="text-muted-foreground">Practice answering common and role-specific questions in a low-pressure environment before the real thing.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40">
        <p>Your private space for career growth.</p>
      </footer>
    </div>
  );
}
