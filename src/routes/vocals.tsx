import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel, PanelHeader } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssets, useSongs, useVoiceProfiles } from "@/hooks/use-bridge";
import { bridge } from "@/bridge";
import { toast } from "sonner";
import { Dice5, Mic2, ShieldAlert } from "lucide-react";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";

export const Route = createFileRoute("/vocals")({
  head: () => ({
    meta: [
      { title: "Vocals — Varynt Studio" },
      { name: "description", content: "Fish Speech 1.5 guide vocals and voice prototypes." },
    ],
  }),
  component: VocalsPage,
});

function VocalsPage() {
  const { data: songs } = useSongs();
  const { data: assets } = useAssets();
  const { data: profiles } = useVoiceProfiles();
  const references = (assets ?? []).filter((a) => a.kind === "reference");
  const outputs = (assets ?? []).filter((a) => a.kind === "vocal").slice(0, 8);

  const [mode, setMode] = useState<"random" | "reference">("random");
  const [songId, setSongId] = useState("");
  const [text, setText] = useState("");
  const [seed, setSeed] = useState("");
  const [format, setFormat] = useState<"wav" | "flac">("wav");
  const [refId, setRefId] = useState("");
  const [refTranscript, setRefTranscript] = useState("");
  const [profileName, setProfileName] = useState("");
  const [consent, setConsent] = useState(false);

  const submit = async () => {
    try {
      await bridge.createFishSpeechJob({
        songId: songId || undefined,
        mode,
        text,
        referenceAssetId: mode === "reference" ? refId : undefined,
        referenceTranscript: mode === "reference" ? refTranscript : undefined,
        voiceProfileName: profileName || undefined,
        consentConfirmed: mode === "reference" ? consent : true,
        seed: seed ? Number(seed) : undefined,
        outputFormat: format,
      });
      toast.success("Voice generation queued");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to queue");
    }
  };

  const referenceReady =
    mode === "random" ||
    (mode === "reference" && refId && refTranscript.trim().length > 0 && consent);
  const canSubmit = text.trim().length > 0 && Boolean(referenceReady);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Vocals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fish Speech 1.5 · guide vocals and speech prototypes.
        </p>
      </header>

      <div className="rounded-lg border border-warn/30 bg-warn/5 px-4 py-3 text-xs text-warn">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Noncommercial · CC BY-NC-SA 4.0</p>
            <p className="mt-1 text-warn/90">
              Fish Speech 1.5 is licensed for noncommercial use. It is intended here for guide
              vocals and prototypes, not cleared commercial masters. It is speech and guide-vocal
              technology, not a dedicated singing conversion engine.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
        <Panel className="p-5">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="random">Random voice</TabsTrigger>
              <TabsTrigger value="reference">Reference voice</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <div>
                <Label>Song</Label>
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
                <Label>Text / lyrics</Label>
                <Textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Lyric or spoken guide line…"
                />
              </div>

              <TabsContent value="reference" className="m-0 space-y-4">
                <div>
                  <Label>Reference audio</Label>
                  <Select value={refId} onValueChange={setRefId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          references.length
                            ? "Pick a reference clip"
                            : "No reference clips imported yet"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {references.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Prefer a clean 10–20 second recording with one speaker and little background
                    noise.
                  </p>
                </div>
                <div>
                  <Label>Exact reference transcript</Label>
                  <Textarea
                    rows={3}
                    value={refTranscript}
                    onChange={(e) => setRefTranscript(e.target.value)}
                    placeholder="Type exactly what is said in the reference clip."
                  />
                </div>
                <div>
                  <Label>Reference profile name</Label>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Guide — Male, warm mid-range"
                  />
                </div>
                <label className="flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs">
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(v) => setConsent(Boolean(v))}
                    className="mt-0.5"
                  />
                  <span className="text-foreground">
                    I have the speaker's permission to use this voice reference.
                  </span>
                </label>
              </TabsContent>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Seed</Label>
                  <div className="flex gap-2">
                    <Input
                      value={seed}
                      onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="random"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Randomize seed"
                      onClick={() => setSeed(Math.floor(Math.random() * 100000).toString())}
                    >
                      <Dice5 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Output format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wav">WAV · 44.1 kHz</SelectItem>
                      <SelectItem value="flac">FLAC · 44.1 kHz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="rounded border border-border bg-surface-2 px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                {songs?.find((s) => s.id === songId)?.folderPath ?? "D:\\Varynt\\Vocals"}
                \\vocals\\fs-*.{format}
              </p>
            </div>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button onClick={submit} disabled={!canSubmit} className="gap-2">
              <Mic2 className="h-4 w-4" /> Generate voice
            </Button>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5">
            <PanelHeader
              title="Saved reference profiles"
              description={`${profiles?.length ?? 0} consented profile${(profiles?.length ?? 0) === 1 ? "" : "s"}`}
            />
            <ul className="mt-3 space-y-2">
              {(profiles ?? []).length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-surface-2/50 px-3 py-6 text-center text-xs text-muted-foreground">
                  No consented profiles saved yet.
                </p>
              ) : (
                (profiles ?? []).map((p) => (
                  <li key={p.id} className="rounded-md border border-border bg-surface-2 px-3 py-2">
                    <p className="text-sm text-foreground">{p.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Consent confirmed · created {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="Recent voice output" />
            <div className="mt-3 grid gap-2">
              {outputs.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-surface-2/50 px-3 py-6 text-center text-xs text-muted-foreground">
                  Generated voice takes will appear here.
                </p>
              ) : (
                outputs.map((a) => <AudioAssetCard key={a.id} asset={a} />)
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
