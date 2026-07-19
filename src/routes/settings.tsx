import { createFileRoute } from "@tanstack/react-router";
import { Panel, PanelHeader } from "@/components/common/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Varynt Studio" },
      { name: "description", content: "Workspace, defaults, and external app paths." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");
  const [restrainedMotion, setRestrainedMotion] = useState(true);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace defaults, external application paths, and UI preferences.
        </p>
      </header>

      <MockNotice />

      <Panel className="p-5">
        <PanelHeader title="Workspace" description="Where projects and outputs live on disk." />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Workspace root" defaultValue="D:\\Varynt" />
          <Field
            label="Default song template"
            defaultValue="Intro / Verse / Chorus / Verse / Chorus / Breakdown / Final Chorus / Outro"
          />
          <Field label="Generations folder" defaultValue="{song}\\generations" />
          <Field label="Stems folder" defaultValue="{song}\\stems" />
          <Field label="Vocals folder" defaultValue="{song}\\vocals" />
          <Field label="Mixes folder" defaultValue="{song}\\mixes" />
          <Field label="Masters folder" defaultValue="{song}\\masters" />
        </div>
      </Panel>

      <Panel className="p-5">
        <PanelHeader title="Generation defaults" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Default MusicGen model</Label>
            <Select defaultValue="small">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (RTX 5060 Ti)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="Default MusicGen duration (s)" defaultValue="15" />
          <Field label="Default Stable Audio duration (s)" defaultValue="30" />
        </div>
      </Panel>

      <Panel className="p-5">
        <PanelHeader title="Model cache locations" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Hugging Face cache" defaultValue="C:\\Users\\me\\.cache\\huggingface" />
          <Field label="AudioCraft cache" defaultValue="C:\\Users\\me\\.cache\\audiocraft" />
        </div>
      </Panel>

      <Panel className="p-5">
        <PanelHeader
          title="External app paths"
          description="These paths must resolve before the bridge can launch UVR or REAPER."
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="REAPER executable" placeholder="C:\\Program Files\\REAPER\\reaper.exe" />
          <Field
            label="UVR executable"
            placeholder="C:\\Program Files\\Ultimate Vocal Remover\\UVR.exe"
          />
          <Field label="FFmpeg" defaultValue="ffmpeg (on PATH)" />
        </div>
      </Panel>

      <Panel className="p-5">
        <PanelHeader title="Audio preview" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Output device (placeholder)</Label>
            <Select defaultValue="default">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">System default</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Real device selection will be available when the bridge exposes the audio graph.
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <PanelHeader title="UI theme and density" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Density</Label>
            <Select value={density} onValueChange={(v) => setDensity(v as typeof density)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center justify-between rounded border border-border bg-surface-2 px-3 py-2.5 text-sm">
            <span>
              <span className="text-foreground">Restrained motion</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                Limit non-audio animations to progress and status transitions.
              </span>
            </span>
            <Switch checked={restrainedMotion} onCheckedChange={setRestrainedMotion} />
          </label>
        </div>
      </Panel>

      <Panel className="p-5">
        <PanelHeader title="Diagnostics" />
        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between rounded border border-border bg-surface-2 px-3 py-2.5 text-sm">
            <span>
              <span className="text-foreground">Verbose engine logs</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                Capture per-token sampling logs from MusicGen and Fish Speech.
              </span>
            </span>
            <Switch defaultChecked />
          </label>
        </div>
      </Panel>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Settings saved (mock)")}>Save settings</Button>
      </div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} placeholder={placeholder} className="font-mono text-xs" />
    </div>
  );
}

function MockNotice() {
  return (
    <div className="rounded-lg border border-warn/30 bg-warn/5 px-4 py-3 text-xs text-warn">
      Settings persistence is mocked in this UI shell. Changes will call the real local bridge once
      it is connected.
    </div>
  );
}
