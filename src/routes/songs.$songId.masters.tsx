import { createFileRoute } from "@tanstack/react-router";
import { useAssets } from "@/hooks/use-bridge";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";
import { EmptyState } from "@/components/common/panel";
import { Rocket } from "lucide-react";

export const Route = createFileRoute("/songs/$songId/masters")({
  component: MastersTab,
});

function MastersTab() {
  const { songId } = Route.useParams();
  const { data } = useAssets({ songId });
  const masters = (data ?? []).filter((a) => a.kind === "master");
  if (masters.length === 0) {
    return (
      <EmptyState
        icon={<Rocket className="h-5 w-5" />}
        title="No masters yet"
        description="Promote an approved mix from Mix Review to render a master."
      />
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {masters.map((a) => (
        <AudioAssetCard key={a.id} asset={a} />
      ))}
    </div>
  );
}
