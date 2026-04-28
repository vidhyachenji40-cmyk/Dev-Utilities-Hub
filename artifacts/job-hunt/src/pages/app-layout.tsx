import { Show, useClerk, useUser } from "@clerk/react";
import { Link, Redirect, Route, Switch, useLocation } from "wouter";
import { useHealthCheck, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Briefcase, FileText, Mic, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import Portal from "./portal";

export default function AppLayout() {
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();
  const [location] = useLocation();

  const { data: user, isLoading: isLoadingUser } = useGetMe({
    query: {
      enabled: !!isSignedIn,
      queryKey: getGetMeQueryKey(),
    }
  });

  const { data: health } = useHealthCheck();

  if (isLoadingUser) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading your space...</p>
      </div>
    );
  }

  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.firstName 
      ? user.firstName[0]
      : "?";

  return (
    <>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
      
      <Show when="signed-in">
        <div className="min-h-[100dvh] flex flex-col bg-background">
          <header className="h-16 px-6 flex items-center justify-between border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-8">
              <Link href="/app" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
                <Briefcase className="h-6 w-6" />
                <span className="font-semibold text-lg tracking-tight text-foreground hidden sm:inline-block">Job Hunt Toolkit</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-1">
                <Link 
                  href="/app/job-tracker" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/app/job-tracker' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  Job Tracker
                </Link>
                <Link 
                  href="/app/resume-match" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/app/resume-match' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  Resume Match
                </Link>
                <Link 
                  href="/app/interview-prep" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/app/interview-prep' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  Interview Prep
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {health?.status === "ok" && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground" title="System Online">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user?.imageUrl || ""} alt={user?.firstName || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-8">
            {location === "/app" ? <Portal user={user} /> : null}
            {/* The individual workspace pages will be rendered via Switch in App.tsx, but AppLayout is wrapping /app. 
                Wait, if AppLayout is routed at /app, nested routes need to be handled.
                Actually, in wouter, if AppLayout is at /app, it only matches EXACTLY /app unless we do nested routing.
                Ah, I should adjust App.tsx to mount AppLayout for ALL /app routes.
            */}
          </main>
        </div>
      </Show>
    </>
  );
}
