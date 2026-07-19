import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel, PanelHeader, EmptyState } from "@/components/common/panel";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAssets, useSongs } from "@/hooks/use-bridge";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";
import { Library, LayoutGrid, List } from "lucide-react";
import type { AssetKind, EngineId } from "@/bridge/types";
import { relativeTime, formatDuration } from "@/lib/format";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — Varynt Studio" },
      { name: "description", content: "Searchable workspace audio browser." },
    ],
  }),
  component: LibraryPage,
});

const CATEGORIES: { key: AssetKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "generation", label: "Generations" },
  { key: "import", label: "Imported" },
  { key: "stem", label: "Stems" },
  { key: "reference", label: "Vocal references" },
  { key: "vocal", label: "Vocal outputs" },
  { key: "mix", label: "Mixes" },
  { key: "master", label: "Masters" },
  { key: "sample", label: "Samples & loops" },
];

function LibraryPage() {
  const [category, setCategory] = useState<AssetKind | "all">("all");
  const [songId, setSongId] = useState("all");
  const [engine, setEngine] = useState<EngineId | "all">("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"list" | "table">("list");

  const { data: songs } = useSongs();
  const { data: all } = useAssets();

  const filtered = (all ?? []).filter((a) => {
    if (category !== "all" && a.kind !== category) return false;
    if (songId !== "all" && a.songId !== songId) return false;
    if (engine !== "all" && a.engine !== engine) return false;
    if (q && !(a.name.toLowerCase().includes(q.toLowerCase()) || (a.prompt ?? "").toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {all ? `${filtered.length} of ${all.length} items` : "Loading…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or prompt…" className="h-9 w-64" />
          <Select value={songId} onValueChange={setSongId}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Song" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All songs</SelectItem>
              {(songs ?? []).map((s) => (<SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={engine} onValueChange={(v) => setEngine(v as EngineId | "all")}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Engine" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All engines</SelectItem>
              <SelectItem value="musicgen">MusicGen</SelectItem>
              <SelectItem value="stable-audio-3-small">Stable Audio</SelectItem>
              <SelectItem value="fish-speech-1.5">Fish Speech</SelectItem>
              <SelectItem value="uvr">UVR</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex overflow-hidden rounded-md border border-border">
            <Button
              size="sm" variant={view === "list" ? "secondary" : "ghost"}
              className="h-9 rounded-none" onClick={() => setView("list")}
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm" variant={view === "table" ? "secondary" : "ghost"}
              className="h-9 rounded-none" onClick={() => setView("table")}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Panel className="p-3">
          <ul className="space-y-1">
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              const count = c.key === "all"
                ? (all ?? []).length
                : (all ?? []).filter((a) => a.kind === c.key).length;
              return (
                <li key={c.key}>
                  <button
                    onClick={() => setCategory(c.key)}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      active ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="tabular text-[11px] text-muted-foreground">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Library className="h-5 w-5" />}
              title="No matching assets"
              description="Try clearing filters or picking a different category."
            />
          ) : view === "list" ? (
            <div className="grid gap-2 lg:grid-cols-2">
              {filtered.map((a) => (<AudioAssetCard key={a.id} asset={a} />))}
            </div>
          ) : (
            <Panel padded={false}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Engine</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Song</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{a.kind}</TableCell>
                      <TableCell className="text-muted-foreground">{a.engine ?? "—"}</TableCell>
                      <TableCell className="tabular text-muted-foreground">{formatDuration(a.durationSeconds)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {songs?.find((s) => s.id === a.songId)?.title ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{relativeTime(a.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
