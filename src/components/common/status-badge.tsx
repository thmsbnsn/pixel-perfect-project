import { cn } from "@/lib/utils";
import type { ComponentState, JobStatus } from "@/bridge/types";

const componentStateStyles: Record<ComponentState, string> = {
  installed: "bg-success/15 text-success border-success/30",
  available: "bg-success/15 text-success border-success/30",
  busy: "bg-audio/15 text-audio border-audio/30",
  unavailable: "bg-destructive/15 text-destructive border-destructive/30",
  unverified: "bg-warn/15 text-warn border-warn/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
};

const jobStatusStyles: Record<JobStatus, string> = {
  queued: "bg-muted text-muted-foreground border-border",
  running: "bg-audio/15 text-audio border-audio/30",
  completed: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const componentStateLabels: Record<ComponentState, string> = {
  installed: "Installed",
  available: "Available",
  busy: "Busy",
  unavailable: "Unavailable",
  unverified: "Unverified",
  error: "Error",
};

const jobStatusLabels: Record<JobStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Complete",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function ComponentStateBadge({
  state,
  className,
}: {
  state: ComponentState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        componentStateStyles[state],
        className,
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      {componentStateLabels[state]}
    </span>
  );
}

export function JobStatusBadge({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        jobStatusStyles[status],
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {jobStatusLabels[status]}
    </span>
  );
}
