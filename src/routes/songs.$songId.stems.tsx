import { createFileRoute, Link } from "@tanstack/react-router";
import { useAssets } from "@/hooks/use-bridge";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";
import { EmptyState } from "@/components/common/panel";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/songs/$songId/stems")({
  component: StemsTab,
});

function StemsTab() {
  const { songId } = Route.useParams();
  const { data } = useAssets({ songId });
  const stems = (data ?? []).filter((a) => a.kind === "stem");
  if (stems.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="h-5 w-5" />}
        title="No stems yet"
        description="Send an approved generation to UVR to produce vocals, drums, bass, and other stems."
        action={<Button asChild><Link to="/stems">Open Stems</Link></Button>}
      />
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {stems.map((a) => <AudioAssetCard key={a.id} asset={a} />)}
    </div>
  );
}
