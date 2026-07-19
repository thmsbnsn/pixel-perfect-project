import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { AppTopbar } from "@/components/shell/app-topbar";
import { JobDrawer } from "@/components/shell/job-drawer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          404 · route not found
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">This screen doesn't exist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Check the sidebar navigation or return to the dashboard.
        </p>
        <Button asChild className="mt-6">
          <a href="/">Back to dashboard</a>
        </Button>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-destructive">
          Unrecoverable error
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">This screen didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The interface bumped into an unexpected condition. Retry, or return to the dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Varynt Studio — Local AI music workstation" },
      {
        name: "description",
        content:
          "Varynt Studio is a local desktop-first workstation for AI-assisted alternative metal, metalcore, electronic, and hip-hop production. Generate, arrange, mix, and master with MusicGen, Stable Audio, Fish Speech, UVR, and REAPER.",
      },
      { name: "author", content: "Varynt Studio" },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Varynt Studio" },
      {
        property: "og:description",
        content:
          "Local AI music workstation for alt metal, metalcore, electronic, and hip-hop production.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Varynt Studio" },
      {
        name: "twitter:description",
        content: "Local AI music workstation. MusicGen, Stable Audio, Fish Speech, UVR, REAPER.",
      },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [jobsOpen, setJobsOpen] = useState(false);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <AppTopbar onOpenJobs={() => setJobsOpen(true)} />
              <main className="flex-1">
                <Outlet />
              </main>
            </div>
          </div>
          <JobDrawer open={jobsOpen} onOpenChange={setJobsOpen} />
          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
