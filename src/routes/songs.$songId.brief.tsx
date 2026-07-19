import { createFileRoute } from "@tanstack/react-router";
import { useSong } from "@/hooks/use-bridge";
import { Panel, PanelHeader } from "@/components/common/panel";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { bridge } from "@/bridge";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/songs/$songId/brief")({
  component: BriefTab,
});

function BriefTab() {
  const { songId } = Route.useParams();
  const { data: song } = useSong(songId);
  const qc = useQueryClient();
  const [brief, setBrief] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!song) return;
    setBrief(song.creativeBrief);
    setBpm(song.bpm?.toString() ?? "");
    setKey(song.key ?? "");
    setGenre(song.genreTags.join(", "));
    setMood(song.moodTags.join(", "));
  }, [song]);

  if (!song) return null;

  const save = async () => {
    setSaving(true);
    try {
      await bridge.updateSong(song.id, {
        creativeBrief: brief,
        bpm: bpm ? Number(bpm) : undefined,
        key: key || undefined,
        genreTags: genre.split(",").map((s) => s.trim()).filter(Boolean),
        moodTags: mood.split(",").map((s) => s.trim()).filter(Boolean),
      });
      qc.invalidateQueries({ queryKey: ["songs"] });
      toast.success("Brief updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel className="p-5">
      <PanelHeader title="Creative brief" description="Reference sound, energy, and structural intent." />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Label>Brief</Label>
          <Textarea rows={8} value={brief} onChange={(e) => setBrief(e.target.value)} />
        </div>
        <div>
          <Label>BPM</Label>
          <Input value={bpm} onChange={(e) => setBpm(e.target.value.replace(/[^0-9]/g, ""))} />
        </div>
        <div>
          <Label>Key</Label>
          <Input value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        <div>
          <Label>Genre tags</Label>
          <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="comma separated" />
        </div>
        <div>
          <Label>Mood tags</Label>
          <Input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="comma separated" />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </Panel>
  );
}
