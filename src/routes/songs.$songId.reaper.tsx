import { createFileRoute } from "@tanstack/react-router";
import { Panel, PanelHeader, ErrorState } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { bridge } from "@/bridge";
import { toast } from "sonner";
import { useSystemStatus } from "@/hooks/use-bridge";
import { ComponentStateBadge } from "@/components/common/status-badge";

export const Route = createFileRoute("/songs/$songId/reaper")({
  component: ReaperTab,
});

function ReaperTab() {
  const { songId } = Route.useParams();
  const { data: status } = useSystemStatus();
  const reaper = status?.find((s) => s.id === "reaper");
  const configured = reaper?.state === "installed" || reaper?.state === "available";

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Panel className="p-5">
        <PanelHeader
          title="Arrange in REAPER"
          description="Send the current session — stems, tempo, and markers — into a REAPER project template."
        />
        {!configured ? (
          <ErrorState
            className="mt-4"
            title="REAPER path is not configured"
            description="The bridge cannot launch REAPER until its executable path is set in Settings → External app paths."
            action={<Button size="sm" variant="outline" asChild><a href="/settings">Open Settings</a></Button>}
          />
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            The bridge will open the arrangement template pinned to this song.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() =>
              bridge.openReaper(songId).catch((e: Error) =>
                toast.error(e.message, { description: "Configure the REAPER path in Settings." }),
              )
            }
          >
            Open in REAPER
          </Button>
          <Button
            variant="outline"
            onClick={() => toast("Prepare-project is a bridge action", { description: "Available when the local bridge is connected." })}
          >
            Prepare project
          </Button>
        </div>
      </Panel>

      <Panel className="p-5">
        <PanelHeader title="REAPER status" />
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2">
            <span>REAPER</span>
            {reaper ? <ComponentStateBadge state={reaper.state} /> : null}
          </div>
          {reaper?.message ? (
            <p className="text-xs text-muted-foreground">{reaper.message}</p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
