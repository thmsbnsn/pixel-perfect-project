import { createFileRoute } from "@tanstack/react-router";
import { Panel, PanelHeader } from "@/components/common/panel";
import { useSystemStatus } from "@/hooks/use-bridge";
import { ComponentStateBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { bridge } from "@/bridge";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useJobs } from "@/state/jobs-store";
import { Copy, RefreshCw, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { relativeTime } from "@/lib/format";

export const Route = createFileRoute("/system")({
  head: () => ({
    meta: [
      { title: "System — Varynt Studio" },
      { name: "description", content: "Local component status and diagnostics." },
    ],
  }),
  component: SystemPage,
});

function SystemPage() {
  const { data: status, isLoading, refetch } = useSystemStatus();
  const qc = useQueryClient();
  const jobs = useJobs();
  const diagnostics = jobs.flatMap((j) => j.logs.map((l) => `[${j.engine}] ${j.title} — ${l}`));

  const refresh = async () => {
    await bridge.refreshSystemStatus();
    await qc.invalidateQueries({ queryKey: ["system-status"] });
    toast.success("System status refreshed");
  };

  const copyLog = () => {
    navigator.clipboard
      .writeText(diagnostics.join("\n"))
      .then(() => toast.success("Diagnostics copied"));
  };
  const exportLog = () => {
    const blob = new Blob([diagnostics.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "varynt-diagnostics.log";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">System</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Local component status. Distinguishes installed, available, busy, unavailable, and
            unverified.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4" /> Re-verify
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {(status ?? []).map((s) => (
          <Panel key={s.id} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                {s.version ? (
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{s.version}</p>
                ) : null}
              </div>
              <ComponentStateBadge state={s.state} />
            </div>
            {s.message ? <p className="mt-3 text-xs text-muted-foreground">{s.message}</p> : null}
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{s.device ? s.device.toUpperCase() : "—"}</span>
              <span>
                {s.lastCheckedAt ? `Checked ${relativeTime(s.lastCheckedAt)}` : "Not checked"}
              </span>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-5">
        <PanelHeader
          title="Diagnostics log"
          description="Cross-engine job log. Copy or export the trace to share with the bridge team."
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={copyLog}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={exportLog}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          }
        />
        <ScrollArea className="mt-4 h-72 rounded-md border border-border bg-surface-2">
          <pre className="p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {diagnostics.length === 0 ? "No diagnostics yet." : diagnostics.join("\n")}
          </pre>
        </ScrollArea>
      </Panel>
    </div>
  );
}
