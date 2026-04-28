import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import AppLayout from "@/pages/app-layout";
import Portal from "@/pages/portal";
import JobTracker from "@/pages/job-tracker";
import ResumeMatch from "@/pages/resume-match";
import InterviewPrep from "@/pages/interview-prep";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(155 20% 35%)", // var(--primary)
    colorForeground: "hsl(155 20% 20%)", // var(--foreground)
    colorMutedForeground: "hsl(155 10% 50%)", // var(--muted-foreground)
    colorDanger: "hsl(0 70% 50%)", // var(--destructive)
    colorBackground: "hsl(0 0% 100%)", // var(--card)
    colorInput: "transparent",
    colorInputForeground: "hsl(155 20% 20%)", // var(--foreground)
    colorNeutral: "hsl(40 20% 90%)", // var(--border)
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border dark:bg-card dark:border-card-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-semibold tracking-tight text-foreground",
    headerSubtitle: "text-sm text-muted-foreground",
    socialButtonsBlockButtonText: "text-sm font-medium",
    formFieldLabel: "text-sm font-medium text-foreground",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-sm text-muted-foreground",
    dividerText: "text-xs text-muted-foreground bg-white dark:bg-card px-2",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-sm text-green-600",
    alertText: "text-sm",
    logoBox: "h-8 w-8 mx-auto mb-4 text-primary",
    logoImage: "w-full h-full object-contain",
    socialButtonsBlockButton: "border border-border bg-white hover:bg-muted text-foreground transition-colors dark:bg-card",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground transition-colors font-medium shadow-sm",
    formFieldInput: "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    footerAction: "bg-muted/50 py-4 px-8 flex justify-center items-center gap-2",
    dividerLine: "bg-border h-[1px] w-full",
    alert: "bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive",
    otpCodeFieldInput: "border border-input rounded-md text-center bg-transparent",
    formFieldRow: "mb-4",
    main: "p-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your toolkit",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started with your search",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/app" component={AppLayout} />
          <Route path="/app/job-tracker" component={JobTracker} />
          <Route path="/app/resume-match" component={ResumeMatch} />
          <Route path="/app/interview-prep" component={InterviewPrep} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
