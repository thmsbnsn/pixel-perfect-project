import { createFileRoute } from "@tanstack/react-router";
import { Panel, PanelHeader, EmptyState } from "@/components/common/panel";
import { useAssets, useSongs } from "@/hooks/use-bridge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/releases")({
  head: () => ({
    meta: [
      { title: "Releases — Varynt Studio" },
      { name: "description", content: "Release readiness organization." },
    ],
  }),
  component: ReleasesPage,
});

const CHECKLIST = [
  "Master file rendered",
  "Artwork approved",
  "Title and version confirmed",
  "Artist name confirmed",
  "ISRC assigned",
  "Credits captured",
  "License and rights reviewed",
];

function ReleasesPage() {
  const { data: songs } = useSongs();
  const { data: assets } = useAssets();
  const masters = (assets ?? []).filter((a) => a.kind === "master");

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Releases</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize release candidates. No distribution integrations — organizational only.
        </p>
      </header>

      {(songs ?? []).length === 0 ? (
        <EmptyState
          icon={<Rocket className="h-5 w-5" />}
          title="No songs to prepare"
          description="Create and complete a song, then return here to organize a release."
        />
      ) : (
        <div className="grid gap-4">
          {(songs ?? []).map((s) => {
            const master = masters.find((m) => m.songId === s.id);
            return (
              <Panel key={s.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {s.bpm ? `${s.bpm} BPM · ` : ""}{s.key ?? "no key"} · {s.timeSignature}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {master ? (
                      <span className="inline-flex items-center gap-1.5 rounded border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Master ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                        <Circle className="h-3.5 w-3.5" /> No master yet
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Release title</Label>
                        <Input defaultValue={s.title} />
                      </div>
                      <div>
                        <Label>Version</Label>
                        <Input defaultValue="1.0" />
                      </div>
                      <div>
                        <Label>Artist name</Label>
                        <Input placeholder="e.g. Varynt" />
                      </div>
                      <div>
                        <Label>ISRC (placeholder)</Label>
                        <Input placeholder="US-XXX-25-00001" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Credits</Label>
                        <Input placeholder="Written by …, produced by …" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      <Checkbox /> Explicit content
                    </label>
                  </div>

                  <div>
                    <PanelHeader title="Rights checklist" />
                    <ul className="mt-3 space-y-1.5">
                      {CHECKLIST.map((item, i) => (
                        <li key={item} className="flex items-center gap-2 rounded border border-border bg-surface-2 px-2.5 py-1.5 text-xs">
                          <Checkbox defaultChecked={i === 0 && !!master} />
                          <span className="text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toast.success("Release notes saved (mock)")}>Save</Button>
                      <Button size="sm" onClick={() => toast.success("Export package built (mock)")}>Export package</Button>
                    </div>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
