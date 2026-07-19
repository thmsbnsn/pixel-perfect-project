import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Activity, Upload, Plus } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useSongs } from "@/hooks/use-bridge";
import { useActiveJobCount } from "@/state/jobs-store";
import { useState, type ReactNode } from "react";
import { NewSongDialog } from "@/features/songs/new-song-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

const routeCrumbs: Record<string, string> = {
  "": "Dashboard",
  songs: "Songs",
  generate: "Generate",
  vocals: "Vocals",
  stems: "Stems",
  library: "Library",
  "mix-review": "Mix Review",
  releases: "Releases",
  system: "System",
  settings: "Settings",
};

export function AppTopbar({ onOpenJobs }: { onOpenJobs: () => void }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  const activeJobs = useActiveJobCount();
  const { data: songs } = useSongs();
  const navigate = useNavigate();
  const [newOpen, setNewOpen] = useState(false);

  const currentSongId = parts[0] === "songs" && parts[1] ? parts[1] : undefined;

  const crumbs: { label: string; to?: string }[] = [{ label: "Workspace", to: "/" }];
  if (parts.length === 0) {
    crumbs.push({ label: "Dashboard" });
  } else if (parts[0] === "songs" && parts[1]) {
    const song = songs?.find((s) => s.id === parts[1]);
    crumbs.push({ label: "Songs", to: "/songs" });
    crumbs.push({ label: song?.title ?? "Song" });
    if (parts[2]) crumbs.push({ label: parts[2] });
  } else {
    crumbs.push({ label: routeCrumbs[parts[0]] ?? parts[0] });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : null}
            {c.to ? (
              <Link
                to={c.to}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {c.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:block">
          <Select
            value={currentSongId ?? ""}
            onValueChange={(v) => {
              if (v) navigate({ to: "/songs/$songId", params: { songId: v } });
            }}
          >
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="Jump to song…" />
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

        <Button variant="outline" size="sm" onClick={onOpenJobs} className="gap-2">
          <Activity className="h-4 w-4" />
          Jobs
          {activeJobs > 0 ? (
            <span className="ml-1 rounded bg-audio/20 px-1.5 text-[10px] font-medium text-audio tabular">
              {activeJobs}
            </span>
          ) : null}
        </Button>

        <QuickImportButton />

        <Button size="sm" className="gap-2" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" />
          New Song
        </Button>

        <NewSongDialog open={newOpen} onOpenChange={setNewOpen} />
      </div>
    </header>
  );
}

function QuickImportButton(): ReactNode {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() =>
        toast("Quick import is a bridge action", {
          description:
            "The local bridge will show a native file picker when connected. This shell is mock-only.",
        })
      }
    >
      <Upload className="h-4 w-4" />
      Import
    </Button>
  );
}
