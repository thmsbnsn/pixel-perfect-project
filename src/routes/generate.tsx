import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel, PanelHeader } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJobs } from "@/state/jobs-store";
import { useAssets, useSongs } from "@/hooks/use-bridge";
import { bridge } from "@/bridge";
import { toast } from "sonner";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";
import { JobStatusBadge } from "@/components/common/status-badge";
import { Progress } from "@/components/ui/progress";
import { Dice5, Cpu, Sparkles } from "lucide-react";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "Generate — Varynt Studio" },
      { name: "description", content: "Queue MusicGen and Stable Audio generations." },
    ],
  }),
  component: GeneratePage,
});

const CHIPS = ["riff", "drums", "breakdown", "ambience", "transition", "full section"];

function GeneratePage() {
  const { data: songs } = useSongs();
  const [engine, setEngine] = useState<"musicgen" | "stable-audio-3-small">("musicgen");
  // Per-engine state so form data is preserved when switching tabs
  const [mg, setMg] = useState({
    songId: "",
    prompt: "",
    duration: 15,
    variations: 2,
    seed: "",
    prefix: "gen",
  });
  const [sa, setSa] = useState({
    songId: "",
    prompt: "",
    duration: 30,
    variations: 1,
    seed: "",
    prefix: "sa",
  });
  const jobs = useJobs();
  const activeGen = jobs.filter((j) => j.type === "music-generation").slice(0, 8);
  const { data: allAssets } = useAssets();
  const recent = (allAssets ?? []).filter((a) => a.kind === "generation").slice(0, 8);

  const setChip = (chip: string) => {
    if (engine === "musicgen")
      setMg((s) => ({ ...s, prompt: s.prompt ? `${s.prompt}, ${chip}` : chip }));
    else setSa((s) => ({ ...s, prompt: s.prompt ? `${s.prompt}, ${chip}` : chip }));
  };

  const submit = async () => {
    try {
      if (engine === "musicgen") {
        if (!mg.prompt.trim()) return toast.error("A prompt is required.");
        await bridge.createMusicGenJob({
          songId: mg.songId || undefined,
          prompt: mg.prompt.trim(),
          durationSeconds: mg.duration,
          variations: mg.variations,
          seed: mg.seed ? Number(mg.seed) : undefined,
          outputPrefix: mg.prefix,
        });
      } else {
        if (!sa.prompt.trim()) return toast.error("A prompt is required.");
        await bridge.createStableAudioJob({
          songId: sa.songId || undefined,
          prompt: sa.prompt.trim(),
          durationSeconds: sa.duration,
          variations: sa.variations,
          seed: sa.seed ? Number(sa.seed) : undefined,
          outputPrefix: sa.prefix,
        });
      }
      toast.success("Job queued", { description: "Watch progress in the Jobs drawer." });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Job failed to start");
    }
  };

  const dest = (prefix: string, songId?: string) => {
    const s = songs?.find((x) => x.id === songId);
    return s
      ? `${s.folderPath}\\generations\\${prefix}-*.wav`
      : `D:\\Varynt\\Projects\\_out\\${prefix}-*.wav`;
  };

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Generate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Instrumental generation with MusicGen and Stable Audio 3 Small-Music.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Panel className="p-5">
          <Tabs value={engine} onValueChange={(v) => setEngine(v as typeof engine)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="musicgen">MusicGen</TabsTrigger>
              <TabsTrigger value="stable-audio-3-small">Stable Audio</TabsTrigger>
            </TabsList>

            <TabsContent value="musicgen" className="mt-4 space-y-4">
              <EngineBadge engine="cuda" label="MusicGen · small · RTX 5060 Ti" />
              <SongPicker
                songs={songs ?? []}
                value={mg.songId}
                onChange={(v) => setMg((s) => ({ ...s, songId: v }))}
              />
              <PromptField
                value={mg.prompt}
                onChange={(v) => setMg((s) => ({ ...s, prompt: v }))}
                onChip={setChip}
              />
              <DurationField
                value={mg.duration}
                min={4}
                max={30}
                onChange={(v) => setMg((s) => ({ ...s, duration: v }))}
              />
              <VariationsField
                value={mg.variations}
                onChange={(v) => setMg((s) => ({ ...s, variations: v }))}
              />
              <SeedField value={mg.seed} onChange={(v) => setMg((s) => ({ ...s, seed: v }))} />
              <PrefixField
                value={mg.prefix}
                onChange={(v) => setMg((s) => ({ ...s, prefix: v }))}
              />
              <p className="rounded border border-border bg-surface-2 px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                {dest(mg.prefix, mg.songId)}
              </p>
            </TabsContent>

            <TabsContent value="stable-audio-3-small" className="mt-4 space-y-4">
              <EngineBadge engine="cpu" label="Stable Audio 3 Small-Music · CPU" />
              <p className="rounded border border-warn/30 bg-warn/5 px-2 py-1.5 text-[11px] text-warn">
                Text-to-audio only. Audio-to-audio and inpainting are planned once the local bridge
                exposes them.
              </p>
              <SongPicker
                songs={songs ?? []}
                value={sa.songId}
                onChange={(v) => setSa((s) => ({ ...s, songId: v }))}
              />
              <PromptField
                value={sa.prompt}
                onChange={(v) => setSa((s) => ({ ...s, prompt: v }))}
                onChip={setChip}
              />
              <DurationField
                value={sa.duration}
                min={1}
                max={120}
                onChange={(v) => setSa((s) => ({ ...s, duration: v }))}
              />
              <VariationsField
                value={sa.variations}
                onChange={(v) => setSa((s) => ({ ...s, variations: v }))}
              />
              <SeedField value={sa.seed} onChange={(v) => setSa((s) => ({ ...s, seed: v }))} />
              <PrefixField
                value={sa.prefix}
                onChange={(v) => setSa((s) => ({ ...s, prefix: v }))}
              />
              <p className="rounded border border-border bg-surface-2 px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                {dest(sa.prefix, sa.songId)}
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => toast("Preset saved locally (mock)")}>
              <Sparkles className="mr-2 h-4 w-4" /> Save prompt as preset
            </Button>
            <Button onClick={submit}>Generate</Button>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5">
            <PanelHeader
              title="Queue"
              description={`${activeGen.length} generation job${activeGen.length === 1 ? "" : "s"}`}
            />
            <div className="mt-3 space-y-2">
              {activeGen.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-surface-2/50 px-3 py-6 text-center text-xs text-muted-foreground">
                  No generation jobs yet.
                </p>
              ) : (
                activeGen.map((j) => (
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
                    {j.progress != null && (j.status === "running" || j.status === "queued") ? (
                      <Progress value={Math.round(j.progress * 100)} className="mt-2 h-1.5" />
                    ) : null}
                    {j.error ? (
                      <p className="mt-2 text-[11px] text-destructive">{j.error.message}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Recent results" description="Latest generations across all songs" />
            <div className="mt-4 grid gap-2">
              {recent.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-surface-2/50 px-3 py-6 text-center text-xs text-muted-foreground">
                  Completed generations will appear here.
                </p>
              ) : (
                recent.map((a) => <AudioAssetCard key={a.id} asset={a} />)
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function EngineBadge({ engine, label }: { engine: "cpu" | "cuda"; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs">
      <Cpu className="h-4 w-4 text-muted-foreground" />
      <span className="text-foreground">{label}</span>
      <span className="ml-auto rounded bg-surface-3 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {engine.toUpperCase()}
      </span>
    </div>
  );
}

function SongPicker({
  songs,
  value,
  onChange,
}: {
  songs: { id: string; title: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>Song</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="No song (Library only)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No song (Library only)</SelectItem>
          {songs.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PromptField({
  value,
  onChange,
  onChip,
}: {
  value: string;
  onChange: (v: string) => void;
  onChip: (chip: string) => void;
}) {
  return (
    <div>
      <Label>Prompt</Label>
      <Textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. electronic metalcore chorus, wall of guitars, half-time drums"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChip(c)}
            className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function DurationField({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>Duration</Label>
        <span className="tabular text-xs text-muted-foreground">{value}s</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v ?? min)}
      />
    </div>
  );
}

function VariationsField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>Variations</Label>
        <span className="tabular text-xs text-muted-foreground">{value}</span>
      </div>
      <Slider min={1} max={4} step={1} value={[value]} onValueChange={([v]) => onChange(v ?? 1)} />
    </div>
  );
}

function SeedField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>Seed</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="random"
        />
        <Button
          size="icon"
          variant="outline"
          aria-label="Randomize seed"
          onClick={() => onChange(Math.floor(Math.random() * 100000).toString())}
        >
          <Dice5 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PrefixField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>Output naming prefix</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
