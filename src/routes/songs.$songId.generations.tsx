import { createFileRoute, Link } from "@tanstack/react-router";
import { useAssets } from "@/hooks/use-bridge";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";
import { EmptyState } from "@/components/common/panel";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/songs/$songId/generations")({
  component: GenerationsTab,
});

function GenerationsTab() {
  const { songId } = Route.useParams();
  const { data } = useAssets({ songId });
  const gens = (data ?? []).filter((a) => a.kind === "generation");

  if (gens.length === 0) {
    return (
      <EmptyState
        icon={<Wand2 className="h-5 w-5" />}
        title="No generations yet"
        description="Queue a MusicGen or Stable Audio job to build up ideas for this song."
        action={
          <Button asChild>
            <Link to="/generate">Open Generate</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {gens.map((a) => (
        <AudioAssetCard key={a.id} asset={a} />
      ))}
    </div>
  );
}
