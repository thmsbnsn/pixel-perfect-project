import { createFileRoute, Link } from "@tanstack/react-router";
import { useAssets } from "@/hooks/use-bridge";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";
import { EmptyState } from "@/components/common/panel";
import { Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/songs/$songId/mixes")({
  component: MixesTab,
});

function MixesTab() {
  const { songId } = Route.useParams();
  const { data } = useAssets({ songId });
  const mixes = (data ?? []).filter((a) => a.kind === "mix");
  if (mixes.length === 0) {
    return (
      <EmptyState
        icon={<Waves className="h-5 w-5" />}
        title="No mixes captured yet"
        description="Bounce a rough mix from REAPER, then compare versions in Mix Review."
      />
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-2">
        {mixes.map((a) => <AudioAssetCard key={a.id} asset={a} />)}
      </div>
      <Button asChild variant="outline"><Link to="/mix-review">Open Mix Review</Link></Button>
    </div>
  );
}
