import { createFileRoute, Link } from "@tanstack/react-router";
import { useSongs, useAssets, useSystemStatus } from "@/hooks/use-bridge";
import { useJobs } from "@/state/jobs-store";
import { Panel, PanelHeader, EmptyState } from "@/components/common/panel";
import { ComponentStateBadge, JobStatusBadge } from "@/components/common/status-badge";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Music2, Wand2, Mic2, Layers, PlayCircle, ArrowRight } from "lucide-react";
import { relativeTime } from "@/lib/format";
import { useState } from "react";
import { NewSongDialog } from "@/features/songs/new-song-dialog";
import type { SongStage } from "@/bridge/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Varynt Studio" },
      { name: "description", content: "Production overview for Varynt Studio." },
    ],
  }),
  component: Dashboard,
});

const STAGE_LABELS: Record<SongStage, string> = {
  brief: "Brief",
  generating: "Generating",
  selecting: "Selecting",
  stems: "Stems",
  arranging: "Arranging",
  vocals: "Vocals",
  mixing: "Mixing",
  mastering: "Mastering",
  complete: "Complete",
  archived: "Archived",
};

function Dashboard() {
  const { data: songs, isLoading: songsLoading } = useSongs();
  const { data: assets } = useAssets();
  const { data: status } = useSystemStatus();
  const jobs = useJobs();
  const [newOpen, setNewOpen] = useState(false);

  const current = songs?.[0];
  const activeJobs = jobs.filter((j) => j.status === "running" || j.status === "queued");
  const recentGenerations = (assets ?? [])
    .filter((a) => a.kind === "generation" || a.kind === "vocal")
    .slice(0, 6);

  const stageCounts = {
    Ideas: (assets ?? []).filter((a) => a.kind === "generation").length,
    Selected: (assets ?? []).filter((a) => a.favorite && a.kind === "generation").length,
    Stems: (assets ?? []).filter((a) => a.kind === "stem").length,
    Arrangement: (songs ?? []).filter((s) => s.stage === "arranging").length,
    Mix: (assets ?? []).filter((a) => a.kind === "mix").length,
    Master: (assets ?? []).filter((a) => a.kind === "master").length,
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Studio overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Working queue, recent output, and system readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/generate" className="gap-2">
              <Wand2 className="h-4 w-4" /> Generate
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/vocals" className="gap-2">
              <Mic2 className="h-4 w-4" /> Voice guide
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/stems" className="gap-2">
              <Layers className="h-4 w-4" /> Separate stems
            </Link>
          </Button>
          <Button size="sm" onClick={() => setNewOpen(true)} className="gap-2">
            <Music2 className="h-4 w-4" /> New song
          </Button>
        </div>
      </header>

      {songsLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !songs || songs.length === 0 ? (
        <EmptyState
          icon={<Music2 className="h-5 w-5" />}
          title="No songs yet"
          description="Create your first song to define its brief, generate instrumental beds, and route audio through the pipeline."
          action={<Button onClick={() => setNewOpen(true)}>Create a song</Button>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Panel className="p-5">
            <PanelHeader
              title="Continue working"
              description={
                current ? `${current.title} · ${STAGE_LABELS[current.stage]}` : undefined
              }
              actions={
                current ? (
                  <Button size="sm" asChild>
                    <Link to="/songs/$songId" params={{ songId: current.id }} className="gap-2">
                      Open workspace <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : undefined
              }
            />
            {current ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <SongStatCell label="BPM" value={current.bpm?.toString() ?? "—"} />
                <SongStatCell label="Key" value={current.key ?? "—"} />
                <SongStatCell label="Updated" value={relativeTime(current.updatedAt)} />
                <SongStatCell label="Generations" value={current.counts.generations.toString()} />
                <SongStatCell label="Stems" value={current.counts.stems.toString()} />
                <SongStatCell label="Mixes" value={current.counts.mixes.toString()} />
              </div>
            ) : null}
            {current?.creativeBrief ? (
              <p className="mt-4 rounded-md border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
                {current.creativeBrief}
              </p>
            ) : null}
          </Panel>

          <Panel className="p-5">
            <PanelHeader
              title="Active jobs"
              description={`${activeJobs.length} running or queued`}
            />
            <div className="mt-3 space-y-2">
              {activeJobs.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-surface-2/50 px-3 py-6 text-center text-xs text-muted-foreground">
                  No jobs are running.
                </p>
              ) : (
                activeJobs.slice(0, 4).map((j) => (
                  <div key={j.id} className="rounded-md border border-border bg-surface-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-foreground">
                        {j.title}
                      </p>
                      <JobStatusBadge status={j.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {j.engine} · {j.device.toUpperCase()} · {j.stageLabel}
                    </p>
                    {j.progress != null ? (
                      <Progress value={Math.round(j.progress * 100)} className="mt-2 h-1.5" />
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="p-5">
          <PanelHeader
            title="Recent songs"
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/songs" className="gap-1 text-xs">
                  All songs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(songs ?? []).slice(0, 6).map((s) => (
              <Link
                key={s.id}
                to="/songs/$songId"
                params={{ songId: s.id }}
                className="group rounded-lg border border-border bg-surface-2 p-4 transition-colors hover:border-primary/40 hover:bg-surface-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.bpm ? `${s.bpm} BPM · ` : ""}
                      {s.key ?? "no key"} · {relativeTime(s.updatedAt)}
                    </p>
                  </div>
                  <span className="rounded border border-border bg-surface-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {STAGE_LABELS[s.stage]}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px] text-muted-foreground">
                  <MiniCount label="Gen" value={s.counts.generations} />
                  <MiniCount label="Stems" value={s.counts.stems} />
                  <MiniCount label="Voc" value={s.counts.vocals} />
                  <MiniCount label="Mix" value={s.counts.mixes} />
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <PanelHeader title="Pipeline" description="Assets by stage" />
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(stageCounts).map(([stage, count]) => (
              <li
                key={stage}
                className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2"
              >
                <span className="text-foreground">{stage}</span>
                <span className="tabular text-muted-foreground">{count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="p-5">
          <PanelHeader
            title="Recent output"
            description="Latest generated audio across engines"
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/library" className="gap-1 text-xs">
                  Library <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          />
          <div className="mt-4 grid gap-2">
            {recentGenerations.length === 0 ? (
              <EmptyState
                icon={<PlayCircle className="h-5 w-5" />}
                title="No generations yet"
                description="Queue a MusicGen or Stable Audio job from the Generate screen."
              />
            ) : (
              recentGenerations.map((a) => <AudioAssetCard key={a.id} asset={a} compact />)
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <PanelHeader
            title="System readiness"
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/system" className="gap-1 text-xs">
                  Details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          />
          <ul className="mt-4 space-y-2">
            {(status ?? []).slice(0, 8).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{s.label}</p>
                  {s.version ? (
                    <p className="truncate text-[11px] text-muted-foreground">{s.version}</p>
                  ) : null}
                </div>
                <ComponentStateBadge state={s.state} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <NewSongDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function SongStatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular text-foreground">{value}</p>
    </div>
  );
}

function MiniCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border bg-surface-1 py-1">
      <p className="tabular text-xs font-semibold text-foreground">{value}</p>
      <p className="uppercase tracking-wider">{label}</p>
    </div>
  );
}
