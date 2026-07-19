import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel, PanelHeader, ErrorState } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssets, useSongs, useSystemStatus } from "@/hooks/use-bridge";
import { bridge } from "@/bridge";
import { toast } from "sonner";
import { useJobs } from "@/state/jobs-store";
import { JobStatusBadge, ComponentStateBadge } from "@/components/common/status-badge";
import { Progress } from "@/components/ui/progress";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";
import { Layers, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/stems")({
  head: () => ({
    meta: [
      { title: "Stems — Varynt Studio" },
      { name: "description", content: "UVR stem separation shell." },
    ],
  }),
  component: StemsPage,
});

const PRESETS = [
  "MDX23C — Vocals/Drums/Bass/Other",
  "Demucs v4 — 4 stems",
  "Kim Vocal 2 — vocals + inst",
];
const ALL_STEMS = ["vocals", "drums", "bass", "other", "guitar"];

function StemsPage() {
  const { data: assets } = useAssets();
  const { data: songs } = useSongs();
  const { data: status } = useSystemStatus();
  const uvr = status?.find((s) => s.id === "uvr");
  const jobs = useJobs().filter((j) => j.type === "stem-separation");
  const outputStems = (assets ?? []).filter((a) => a.kind === "stem").slice(0, 8);
  const sources = (assets ?? []).filter(
    (a) =>
      a.kind === "generation" || a.kind === "mix" || a.kind === "import" || a.kind === "sample",
  );

  const [sourceId, setSourceId] = useState("");
  const [preset, setPreset] = useState(PRESETS[0]);
  const [selectedStems, setSelectedStems] = useState<string[]>([
    "vocals",
    "drums",
    "bass",
    "other",
  ]);
  const [songId, setSongId] = useState("");

  const toggleStem = (s: string) => {
    setSelectedStems((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  };

  const dest = songs?.find((s) => s.id === songId)?.folderPath ?? "D:\\Varynt\\Projects\\_out";

  const submit = async () => {
    if (!sourceId) return toast.error("Pick a source audio file.");
    if (selectedStems.length === 0) return toast.error("Pick at least one stem.");
    try {
      await bridge.createStemJob({ sourceAssetId: sourceId, preset, stems: selectedStems });
      toast.success("Stem job queued");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to queue");
    }
  };

  const unavailable = uvr?.state !== "installed" && uvr?.state !== "available";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stems</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ultimate Vocal Remover stem separation.
        </p>
      </header>

      {unavailable ? (
        <ErrorState
          title="UVR was not found."
          description="Set its application path in Settings → External app paths. Stem jobs cannot start until UVR is verified."
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href="/settings">Open Settings</a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => bridge.openUvr().catch((e: Error) => toast.error(e.message))}
              >
                <ExternalLink className="h-4 w-4" /> Open UVR
              </Button>
            </div>
          }
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
        <Panel className="p-5">
          <PanelHeader title="Configure separation" />
          <div className="mt-4 space-y-4">
            <div>
              <Label>Source audio</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick from library" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preset</Label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Song association</Label>
              <Select value={songId} onValueChange={setSongId}>
                <SelectTrigger>
                  <SelectValue placeholder="No song" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No song</SelectItem>
                  {(songs ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected stems</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ALL_STEMS.map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-2 rounded border border-border bg-surface-2 px-2 py-1.5 text-xs"
                  >
                    <Checkbox
                      checked={selectedStems.includes(s)}
                      onCheckedChange={() => toggleStem(s)}
                    />
                    <span className="capitalize text-foreground">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="rounded border border-border bg-surface-2 px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
              {dest}\\stems\\*
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => bridge.openUvr().catch((e: Error) => toast.error(e.message))}
              >
                Open UVR
              </Button>
              <Button onClick={submit} disabled={unavailable} className="gap-2">
                <Layers className="h-4 w-4" /> Start separation
              </Button>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5">
            <PanelHeader title="External application" />
            <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
              <span>UVR</span>
              {uvr ? <ComponentStateBadge state={uvr.state} /> : null}
            </div>
            {uvr?.message ? (
              <p className="mt-2 text-xs text-muted-foreground">{uvr.message}</p>
            ) : null}
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Separation jobs" />
            <div className="mt-3 space-y-2">
              {jobs.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-surface-2/50 px-3 py-6 text-center text-xs text-muted-foreground">
                  No separation jobs yet.
                </p>
              ) : (
                jobs.map((j) => (
                  <div key={j.id} className="rounded-md border border-border bg-surface-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-foreground">
                        {j.title}
                      </p>
                      <JobStatusBadge status={j.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{j.stageLabel}</p>
                    {j.progress != null && (j.status === "queued" || j.status === "running") ? (
                      <Progress value={Math.round(j.progress * 100)} className="mt-2 h-1.5" />
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Recent stem output" />
            <div className="mt-3 grid gap-2">
              {outputStems.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-surface-2/50 px-3 py-6 text-center text-xs text-muted-foreground">
                  Generated stems appear here grouped by source.
                </p>
              ) : (
                outputStems.map((a) => <AudioAssetCard key={a.id} asset={a} />)
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
