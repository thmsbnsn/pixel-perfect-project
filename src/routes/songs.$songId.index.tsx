import { createFileRoute, Link } from "@tanstack/react-router";
import { useSong, useAssets } from "@/hooks/use-bridge";
import { Panel, PanelHeader } from "@/components/common/panel";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SongProject } from "@/bridge/types";

export const Route = createFileRoute("/songs/$songId/")({
  component: Overview,
});

type StageKey = "brief" | "generate" | "select" | "separate" | "arrange" | "vocals" | "mix" | "master";

function Overview() {
  const { songId } = Route.useParams();
  const { data: song } = useSong(songId);
  const { data: assets } = useAssets({ songId });

  if (!song) return null;

  const stages = computeStages(song, assets ?? []);

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Panel className="p-5">
        <PanelHeader
          title="Pipeline"
          description="Progress from creative brief to final master. Completion reflects bridge data, not button clicks."
        />
        <ol className="mt-4 space-y-2">
          {stages.map((s) => (
            <li
              key={s.key}
              className={cn(
                "flex items-start gap-3 rounded-md border border-border bg-surface-2 p-3",
                s.state === "active" && "border-audio/40",
              )}
            >
              <div className="mt-0.5">
                {s.state === "done" ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : s.state === "active" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-audio" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {s.state === "done" ? "Done" : s.state === "active" ? "In progress" : "Not started"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/80">Next:</span> {s.nextAction}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel className="p-5">
        <PanelHeader title="Quick jump" />
        <div className="mt-4 grid gap-2">
          <Button variant="outline" size="sm" asChild className="justify-start">
            <Link to="/songs/$songId/generations" params={{ songId }}>Generations ({song.counts.generations})</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="justify-start">
            <Link to="/songs/$songId/stems" params={{ songId }}>Stems ({song.counts.stems})</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="justify-start">
            <Link to="/songs/$songId/vocals" params={{ songId }}>Vocals ({song.counts.vocals})</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="justify-start">
            <Link to="/songs/$songId/mixes" params={{ songId }}>Mixes ({song.counts.mixes})</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="justify-start">
            <Link to="/songs/$songId/masters" params={{ songId }}>Masters ({song.counts.masters})</Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function computeStages(song: SongProject, assets: { kind: string; favorite: boolean }[]) {
  const has = (k: string) => assets.some((a) => a.kind === k);
  const hasFav = assets.some((a) => a.favorite && a.kind === "generation");
  const rows: {
    key: StageKey;
    label: string;
    description: string;
    nextAction: string;
    state: "done" | "active" | "todo";
  }[] = [
    {
      key: "brief", label: "Brief",
      description: "Working title, BPM, key, mood, and creative brief captured.",
      nextAction: "Refine the brief in the Brief tab.",
      state: song.creativeBrief ? "done" : "active",
    },
    {
      key: "generate", label: "Generate",
      description: "Instrumental ideas rendered with MusicGen or Stable Audio.",
      nextAction: "Queue a MusicGen bed from Generate.",
      state: has("generation") ? "done" : song.creativeBrief ? "active" : "todo",
    },
    {
      key: "select", label: "Select",
      description: "Favorite the takes that will move forward.",
      nextAction: "Mark generations as favorites.",
      state: hasFav ? "done" : has("generation") ? "active" : "todo",
    },
    {
      key: "separate", label: "Separate",
      description: "Split approved audio into stems with UVR.",
      nextAction: "Send a favorite generation to Stems.",
      state: has("stem") ? "done" : hasFav ? "active" : "todo",
    },
    {
      key: "arrange", label: "Arrange",
      description: "Import stems into REAPER and lay out the song.",
      nextAction: "Open in REAPER once its path is configured.",
      state: song.stage === "arranging" || song.stage === "vocals" || song.stage === "mixing"
        ? "active" : song.stage === "mastering" || song.stage === "complete" ? "done" : "todo",
    },
    {
      key: "vocals", label: "Vocals",
      description: "Fish Speech guide vocals and reference-conditioned takes.",
      nextAction: "Generate a guide vocal from Vocals.",
      state: has("vocal") ? "done" : "todo",
    },
    {
      key: "mix", label: "Mix",
      description: "Iterate on rough mixes and compare versions in Mix Review.",
      nextAction: "Open Mix Review to A/B two versions.",
      state: has("mix") ? (song.stage === "mixing" ? "active" : "done") : "todo",
    },
    {
      key: "master", label: "Master",
      description: "Prepare masters and confirm release readiness.",
      nextAction: "Promote an approved mix toward mastering.",
      state: has("master") ? "done" : song.stage === "mastering" ? "active" : "todo",
    },
  ];
  return rows;
}
