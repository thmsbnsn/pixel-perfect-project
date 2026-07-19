import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useSong } from "@/hooks/use-bridge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Panel, ErrorState } from "@/components/common/panel";
import { relativeTime } from "@/lib/format";
import { Wand2, Upload, FolderOpen, Play, MoreHorizontal } from "lucide-react";
import type { SongStage } from "@/bridge/types";
import { cn } from "@/lib/utils";
import { bridge } from "@/bridge";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/songs/$songId")({
  head: ({ params }) => ({
    meta: [
      { title: `Song workspace — Varynt Studio` },
      { name: "description", content: `Workspace for ${params.songId}` },
    ],
  }),
  component: SongWorkspace,
});

const STAGE_LABELS: Record<SongStage, string> = {
  brief: "Brief", generating: "Generating", selecting: "Selecting", stems: "Stems",
  arranging: "Arranging", vocals: "Vocals", mixing: "Mixing", mastering: "Mastering",
  complete: "Complete", archived: "Archived",
};

const TABS = [
  { to: ".", label: "Overview", exact: true },
  { to: "brief", label: "Brief" },
  { to: "generations", label: "Generations" },
  { to: "stems", label: "Stems" },
  { to: "vocals", label: "Vocals" },
  { to: "reaper", label: "REAPER" },
  { to: "mixes", label: "Mixes" },
  { to: "masters", label: "Masters" },
  { to: "notes", label: "Notes" },
] as const;

function SongWorkspace() {
  const { songId } = Route.useParams();
  const { data: song, isLoading, error, refetch } = useSong(songId);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const base = `/songs/${songId}`;
  const currentTab = pathname === base || pathname === `${base}/`
    ? ""
    : pathname.replace(`${base}/`, "").split("/")[0];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4 px-6 py-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (error || !song) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <ErrorState
          title="This song could not be loaded"
          description="It may have been archived or the local bridge is unreachable."
          action={<Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {STAGE_LABELS[song.stage]} · updated {relativeTime(song.updatedAt)}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{song.title}</h1>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{song.folderPath}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground tabular">
              <Meta label="BPM" value={song.bpm?.toString() ?? "—"} />
              <Meta label="Key" value={song.key ?? "—"} />
              <Meta label="Time" value={song.timeSignature} />
              <Meta label="Generations" value={song.counts.generations.toString()} />
              <Meta label="Stems" value={song.counts.stems.toString()} />
              <Meta label="Vocals" value={song.counts.vocals.toString()} />
              <Meta label="Mixes" value={song.counts.mixes.toString()} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/generate" search={{}} className="gap-2"><Wand2 className="h-4 w-4" /> Generate</Link>
            </Button>
            <Button
              size="sm" variant="outline" className="gap-2"
              onClick={() => toast("Import is a bridge action", { description: "Native file picker requires the local bridge." })}
            >
              <Upload className="h-4 w-4" /> Import audio
            </Button>
            <Button
              size="sm" variant="outline" className="gap-2"
              onClick={() => bridge.revealPath(song.folderPath).then(() => toast.success("Reveal requested"))}
            >
              <FolderOpen className="h-4 w-4" /> Reveal folder
            </Button>
            <Button
              size="sm" className="gap-2"
              onClick={() =>
                bridge.openReaper(song.id).catch((e: Error) =>
                  toast.error(e.message, { description: "Configure the REAPER path in Settings." }),
                )
              }
            >
              <Play className="h-4 w-4" /> Open in REAPER
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" aria-label="More actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast("Duplicate is a bridge action")}>
                  Duplicate from template
                </DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/songs">All songs</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Panel>

      <div className="mt-4 flex overflow-x-auto rounded-lg border border-border bg-surface-1 p-1">
        {TABS.map((t) => {
          const active = t.exact ? currentTab === "" : currentTab === t.to;
          const to = t.exact ? `/songs/${songId}` : `/songs/${songId}/${t.to}`;
          return (
            <Link
              key={t.label}
              to={to}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                active ? "bg-surface-3 font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded border border-border bg-surface-2 px-2 py-0.5">
      <span className="mr-1 text-[10px] uppercase tracking-wider text-muted-foreground/80">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}
