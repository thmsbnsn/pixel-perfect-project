import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Panel, PanelHeader, EmptyState } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAssets, useSongs } from "@/hooks/use-bridge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";
import { Waves, Rocket } from "lucide-react";
import { toast } from "sonner";
import { formatDuration } from "@/lib/format";
import { useAudio } from "@/hooks/use-audio";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/mix-review")({
  head: () => ({
    meta: [
      { title: "Mix Review — Varynt Studio" },
      { name: "description", content: "A/B mix comparison and review notes." },
    ],
  }),
  component: MixReviewPage,
});

type Status = "draft" | "changes" | "approved";

function MixReviewPage() {
  const { data: songs } = useSongs();
  const [songId, setSongId] = useState<string>("song_iron-halcyon");
  const { data: assets } = useAssets({ songId });
  const mixes = useMemo(() => (assets ?? []).filter((a) => a.kind === "mix"), [assets]);
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("draft");
  const [loudnessMatch, setLoudnessMatch] = useState(false);
  const { playingId, positionSec, durationSec, toggle } = useAudio();

  const a = mixes.find((m) => m.id === aId) ?? mixes[0];
  const b = mixes.find((m) => m.id === bId) ?? mixes[1];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mix Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A/B compare mix revisions with timestamped notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Song</Label>
          <Select value={songId} onValueChange={setSongId}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(songs ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {mixes.length < 2 ? (
        <EmptyState
          icon={<Waves className="h-5 w-5" />}
          title="Two mixes are needed to compare"
          description="Bounce at least two revisions from REAPER to run an A/B review."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <MixSlot label="A" value={a?.id ?? ""} mixes={mixes} onChange={setAId} />
              <MixSlot label="B" value={b?.id ?? ""} mixes={mixes} onChange={setBId} />
            </div>

            <Panel className="p-5">
              <PanelHeader
                title="Synchronized playback"
                description="Switch between A and B without losing your position."
                actions={
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Loudness match
                    <Switch
                      checked={loudnessMatch}
                      onCheckedChange={setLoudnessMatch}
                      aria-label="Loudness match toggle"
                    />
                  </label>
                }
              />
              {loudnessMatch ? (
                <p className="mt-3 rounded border border-warn/30 bg-warn/5 px-2 py-1.5 text-[11px] text-warn">
                  Loudness match is a planned bridge capability. This UI toggle has no effect yet.
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  variant={playingId === a?.id ? "default" : "secondary"}
                  onClick={() =>
                    a && toggle(a.id, { seed: a.seed, durationSec: a.durationSeconds })
                  }
                  disabled={!a}
                >
                  {playingId === a?.id ? "Pause A" : "Play A"}
                </Button>
                <Button
                  variant={playingId === b?.id ? "default" : "secondary"}
                  onClick={() =>
                    b && toggle(b.id, { seed: b.seed, durationSec: b.durationSeconds })
                  }
                  disabled={!b}
                >
                  {playingId === b?.id ? "Pause B" : "Play B"}
                </Button>
                <span className="tabular text-xs text-muted-foreground">
                  {formatDuration(positionSec)} /{" "}
                  {formatDuration(durationSec || a?.durationSeconds || b?.durationSeconds)}
                </span>
              </div>
              <Progress
                value={durationSec > 0 ? Math.min(100, (positionSec / durationSec) * 100) : 0}
                className="mt-3 h-1.5"
              />
            </Panel>

            <div className="grid gap-3 md:grid-cols-2">
              {a ? <AudioAssetCard asset={a} compact /> : null}
              {b ? <AudioAssetCard asset={b} compact /> : null}
            </div>
          </div>

          <Panel className="p-5">
            <PanelHeader title="Review" />
            <div className="mt-4 space-y-3">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="changes">Needs changes</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes (timestamps optional)</Label>
                <Textarea
                  rows={10}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="0:24 — cymbals too bright&#10;1:12 — bass loses focus in the chorus"
                />
              </div>
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => toast.success("Review saved (mock)")}>
                  Save review
                </Button>
                <Button
                  className="gap-2"
                  disabled={status !== "approved"}
                  onClick={() => toast.success("Approved mix promoted to Master queue (mock)")}
                >
                  <Rocket className="h-4 w-4" /> Promote to Master
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Automated audio-analysis metrics will appear here only when returned by the bridge.
              </p>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function MixSlot({
  label,
  value,
  mixes,
  onChange,
}: {
  label: string;
  value: string;
  mixes: { id: string; name: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Panel className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded bg-primary/20 text-xs font-bold text-primary">
          {label}
        </span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Mix {label}</span>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Pick a mix" />
        </SelectTrigger>
        <SelectContent>
          {mixes.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Panel>
  );
}
