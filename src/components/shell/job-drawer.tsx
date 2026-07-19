import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { JobStatusBadge } from "@/components/common/status-badge";
import { useJobs } from "@/state/jobs-store";
import type { StudioJob } from "@/bridge/types";
import { bridge } from "@/bridge";
import { toast } from "sonner";
import { relativeTime } from "@/lib/format";
import { EmptyState } from "@/components/common/panel";
import { Activity, RefreshCw, X, FolderOpen, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const groups: { key: StudioJob["status"]; label: string }[] = [
  { key: "running", label: "Active" },
  { key: "queued", label: "Queued" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
  { key: "cancelled", label: "Cancelled" },
];

export function JobDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const jobs = useJobs();
  const grouped = useMemo(() => {
    const map = new Map<StudioJob["status"], StudioJob[]>();
    for (const j of jobs) {
      const arr = map.get(j.status) ?? [];
      arr.push(j);
      map.set(j.status, arr);
    }
    return map;
  }, [jobs]);

  const [logsFor, setLogsFor] = useState<StudioJob | null>(null);
  const [cancelFor, setCancelFor] = useState<StudioJob | null>(null);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              Jobs
            </SheetTitle>
            <SheetDescription className="text-xs">
              Queued, active, and finished jobs across every engine.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-6 px-4 py-4">
              {jobs.length === 0 ? (
                <EmptyState
                  icon={<Activity className="h-5 w-5" />}
                  title="No jobs yet"
                  description="Generation, voice, and stem jobs will appear here as you queue them."
                />
              ) : null}
              {groups.map((g) => {
                const items = grouped.get(g.key);
                if (!items || items.length === 0) return null;
                return (
                  <section key={g.key}>
                    <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {g.label} · {items.length}
                    </h4>
                    <div className="space-y-2">
                      {items.map((j) => (
                        <JobRow
                          key={j.id}
                          job={j}
                          onViewLogs={() => setLogsFor(j)}
                          onCancel={() => setCancelFor(j)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={!!logsFor} onOpenChange={(v) => !v && setLogsFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{logsFor?.title}</DialogTitle>
            <DialogDescription>
              Diagnostic log · {logsFor?.engine} · {logsFor?.device.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[50vh] overflow-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
            {(logsFor?.logs ?? []).join("\n")}
          </pre>
          {logsFor?.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="font-medium">{logsFor.error.code}</p>
              <p className="mt-1">{logsFor.error.message}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!cancelFor} onOpenChange={(v) => !v && setCancelFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this job?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelFor?.title} will stop immediately. Any partial output is discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep running</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!cancelFor) return;
                await bridge.cancelJob(cancelFor.id);
                setCancelFor(null);
              }}
            >
              Cancel job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function JobRow({
  job,
  onViewLogs,
  onCancel,
}: {
  job: StudioJob;
  onViewLogs: () => void;
  onCancel: () => void;
}) {
  const canCancel = job.status === "queued" || job.status === "running";
  const canRetry = job.status === "failed" || job.status === "cancelled";
  return (
    <div className="rounded-md border border-border bg-surface-1 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{job.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>{job.engine}</span>
            <span>·</span>
            <span>{job.device.toUpperCase()}</span>
            <span>·</span>
            <span>{job.stageLabel}</span>
            <span>·</span>
            <span>{relativeTime(job.createdAt)}</span>
          </p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      {(job.status === "running" || job.status === "queued") && job.progress != null ? (
        <div className="mt-3">
          <Progress value={Math.round(job.progress * 100)} className="h-1.5" />
        </div>
      ) : null}

      {job.error ? (
        <p className="mt-2 text-[11px] text-destructive">{job.error.message}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs" onClick={onViewLogs}>
          <FileText className="h-3.5 w-3.5" />
          Logs
        </Button>
        {job.outputAssetIds.length > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() =>
              bridge
                .revealPath(`D:\\Varynt\\Projects\\_out\\${job.id}`)
                .then(() => toast.success("Reveal requested"))
                .catch((e: Error) => toast.error(e.message))
            }
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Reveal output
          </Button>
        ) : null}
        {canCancel ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
            onClick={onCancel}
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        ) : null}
        {canRetry ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={async () => {
              try {
                await bridge.retryJob(job.id);
                toast.success("Retry queued");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Retry failed");
              }
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
