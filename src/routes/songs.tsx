import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSongs } from "@/hooks/use-bridge";
import { Panel, EmptyState } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LayoutGrid, List, Music2, FolderOpen, Archive, Copy } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { NewSongDialog } from "@/features/songs/new-song-dialog";
import { relativeTime, formatDuration } from "@/lib/format";
import type { SongProject, SongStage } from "@/bridge/types";
import { bridge } from "@/bridge";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/songs")({
  head: () => ({
    meta: [
      { title: "Songs — Varynt Studio" },
      { name: "description", content: "All songs in the workspace." },
    ],
  }),
  component: SongsPage,
});

const STAGE_LABELS: Record<SongStage, string> = {
  brief: "Brief", generating: "Generating", selecting: "Selecting", stems: "Stems",
  arranging: "Arranging", vocals: "Vocals", mixing: "Mixing", mastering: "Mastering",
  complete: "Complete", archived: "Archived",
};

function SongsPage() {
  const { data, isLoading, error, refetch } = useSongs();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [genre, setGenre] = useState<string>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<SongProject | null>(null);
  const qc = useQueryClient();

  const genres = Array.from(new Set((data ?? []).flatMap((s) => s.genreTags)));
  const filtered = (data ?? []).filter((s) => {
    if (q && !s.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (stage !== "all" && s.stage !== stage) return false;
    if (genre !== "all" && !s.genreTags.includes(genre)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Songs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.length} project${data.length === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title…"
            className="h-9 w-56"
          />
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {Object.entries(STAGE_LABELS).filter(([k]) => k !== "archived").map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Genre" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genres</SelectItem>
              {genres.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex overflow-hidden rounded-md border border-border">
            <Button
              size="sm"
              variant={view === "grid" ? "secondary" : "ghost"}
              className="h-9 rounded-none"
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={view === "table" ? "secondary" : "ghost"}
              className="h-9 rounded-none"
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={() => setNewOpen(true)} className="gap-2">
            <Music2 className="h-4 w-4" /> New song
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-40" />))}
        </div>
      ) : error ? (
        <Panel>
          <p className="text-sm text-destructive">Could not load songs.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Retry</Button>
        </Panel>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Music2 className="h-5 w-5" />}
          title={data && data.length > 0 ? "No songs match your filters" : "No songs yet"}
          description={data && data.length > 0
            ? "Try clearing the filters or search term."
            : "Create your first project to start the production workflow."}
          action={data && data.length === 0 ? (<Button onClick={() => setNewOpen(true)}>Create a song</Button>) : undefined}
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((s) => (
            <SongCard key={s.id} song={s} onArchive={() => setArchiveTarget(s)} />
          ))}
        </div>
      ) : (
        <Panel padded={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>BPM</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Assets</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      to="/songs/$songId"
                      params={{ songId: s.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {s.title}
                    </Link>
                  </TableCell>
                  <TableCell>{STAGE_LABELS[s.stage]}</TableCell>
                  <TableCell className="tabular">{s.bpm ?? "—"}</TableCell>
                  <TableCell>{s.key ?? "—"}</TableCell>
                  <TableCell className="tabular">{formatDuration(s.targetDurationSeconds)}</TableCell>
                  <TableCell className="text-muted-foreground">{relativeTime(s.updatedAt)}</TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">
                    {s.counts.generations + s.counts.stems + s.counts.vocals + s.counts.mixes}
                  </TableCell>
                  <TableCell className="text-right">
                    <SongRowMenu song={s} onArchive={() => setArchiveTarget(s)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}

      <NewSongDialog open={newOpen} onOpenChange={setNewOpen} />

      <AlertDialog open={!!archiveTarget} onOpenChange={(v) => !v && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this song?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.title} will be hidden from the songs list. Files stay on disk and the project can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep active</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!archiveTarget) return;
                await bridge.archiveSong(archiveTarget.id);
                qc.invalidateQueries({ queryKey: ["songs"] });
                toast.success("Song archived");
                setArchiveTarget(null);
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SongCard({ song, onArchive }: { song: SongProject; onArchive: () => void }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-surface-1 transition-colors hover:border-primary/40">
      <Link to="/songs/$songId" params={{ songId: song.id }} className="block">
        <div className="relative aspect-[4/2] w-full overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-surface-3">
          <div className="absolute inset-0 opacity-40 mix-blend-overlay [background:radial-gradient(circle_at_30%_30%,var(--color-audio)_0%,transparent_50%),radial-gradient(circle_at_70%_70%,var(--color-primary)_0%,transparent_60%)]" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-foreground/80">
            <span>{STAGE_LABELS[song.stage]}</span>
            <span>{relativeTime(song.updatedAt)}</span>
          </div>
        </div>
        <div className="p-4">
          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {song.title}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {song.bpm ? `${song.bpm} BPM · ` : ""}{song.key ?? "no key"} · {song.timeSignature}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {song.genreTags.slice(0, 3).map((t) => (
              <span key={t} className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px] text-muted-foreground">
            <MiniCount label="Gen" value={song.counts.generations} />
            <MiniCount label="Stems" value={song.counts.stems} />
            <MiniCount label="Voc" value={song.counts.vocals} />
            <MiniCount label="Mix" value={song.counts.mixes} />
          </div>
        </div>
      </Link>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <SongRowMenu song={song} onArchive={onArchive} />
      </div>
    </div>
  );
}

function SongRowMenu({ song, onArchive }: { song: SongProject; onArchive: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Song actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/songs/$songId" params={{ songId: song.id }}>Open</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast("Duplicate is a bridge action", { description: "Available when the local bridge is connected." })}
        >
          <Copy className="mr-2 h-4 w-4" /> Duplicate from template
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => bridge.revealPath(song.folderPath).then(() => toast.success("Reveal requested"))}
        >
          <FolderOpen className="mr-2 h-4 w-4" /> Reveal folder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onArchive} className="text-destructive focus:text-destructive">
          <Archive className="mr-2 h-4 w-4" /> Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MiniCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border bg-surface-2 py-1">
      <p className="tabular text-xs font-semibold text-foreground">{value}</p>
      <p className="uppercase tracking-wider">{label}</p>
    </div>
  );
}
