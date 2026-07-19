import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bridge } from "@/bridge";
import { slugify } from "@/lib/format";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STRUCTURES = [
  "Intro / Verse / Chorus / Verse / Chorus / Breakdown / Final Chorus / Outro",
  "Intro / Verse / Pre-Chorus / Chorus / Verse / Pre-Chorus / Chorus / Bridge / Final Chorus",
  "Custom",
];

const KEYS = [
  "C major",
  "G major",
  "D major",
  "A major",
  "E major",
  "B major",
  "F# major",
  "F major",
  "Bb major",
  "Eb major",
  "Ab major",
  "Db major",
  "A minor",
  "E minor",
  "B minor",
  "F# minor",
  "C# minor",
  "G# minor",
  "D minor",
  "G minor",
  "C minor",
  "F minor",
  "Bb minor",
  "Eb minor",
];

export function NewSongDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [bpm, setBpm] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [timeSig, setTimeSig] = useState("4/4");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [target, setTarget] = useState("");
  const [brief, setBrief] = useState("");
  const [structure, setStructure] = useState(STRUCTURES[0]);
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setSlug("");
      setSlugTouched(false);
      setBpm("");
      setKey("");
      setTimeSig("4/4");
      setGenre("");
      setMood("");
      setTarget("");
      setBrief("");
      setStructure(STRUCTURES[0]);
      setSubmitting(false);
    }
  }, [open]);

  const bpmNum = bpm ? Number(bpm) : undefined;
  const bpmInvalid = bpm !== "" && (Number.isNaN(bpmNum!) || bpmNum! < 40 || bpmNum! > 240);
  const canSubmit = title.trim().length > 0 && !bpmInvalid && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const song = await bridge.createSong({
        title: title.trim(),
        slug: slug.trim() || undefined,
        bpm: bpmNum,
        key: key || undefined,
        timeSignature: timeSig,
        genreTags: genre
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        moodTags: mood
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        targetDurationSeconds: target ? Number(target) : undefined,
        creativeBrief: brief.trim(),
        structureTemplate: structure,
      });
      qc.invalidateQueries({ queryKey: ["songs"] });
      onOpenChange(false);
      toast.success("Song created", { description: song.title });
      nav({ to: "/songs/$songId", params: { songId: song.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create song");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New song</DialogTitle>
          <DialogDescription>
            Set the creative brief for a new project. All fields except title are optional.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="ns-title">Working title *</Label>
            <Input
              id="ns-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Iron Halcyon"
              autoFocus
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ns-slug">Folder slug</Label>
            <Input
              id="ns-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="auto-generated from title"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Project folder: <span className="tabular">D:\Varynt\Projects\{slug || "…"}</span>
            </p>
          </div>

          <div>
            <Label htmlFor="ns-bpm">BPM</Label>
            <Input
              id="ns-bpm"
              value={bpm}
              onChange={(e) => setBpm(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="40 – 240"
              inputMode="numeric"
            />
            {bpmInvalid ? (
              <p className="mt-1 text-[11px] text-destructive">BPM must be between 40 and 240.</p>
            ) : null}
          </div>
          <div>
            <Label>Key</Label>
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Time signature</Label>
            <Select value={timeSig} onValueChange={setTimeSig}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["4/4", "3/4", "6/8", "7/8", "5/4", "12/8"].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ns-target">Target length (seconds)</Label>
            <Input
              id="ns-target"
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 210"
              inputMode="numeric"
            />
          </div>

          <div>
            <Label htmlFor="ns-genre">Genre tags</Label>
            <Input
              id="ns-genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="metalcore, electronic"
            />
          </div>
          <div>
            <Label htmlFor="ns-mood">Mood tags</Label>
            <Input
              id="ns-mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="driving, cinematic"
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Structure template</Label>
            <Select value={structure} onValueChange={setStructure}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRUCTURES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="ns-brief">Creative brief</Label>
            <Textarea
              id="ns-brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              placeholder="Describe the reference sound, energy, arrangement ideas…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting ? "Creating…" : "Create song"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
