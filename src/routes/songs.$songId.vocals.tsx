import { createFileRoute, Link } from "@tanstack/react-router";
import { useAssets } from "@/hooks/use-bridge";
import { AudioAssetCard } from "@/components/audio/audio-asset-card";
import { EmptyState } from "@/components/common/panel";
import { Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/songs/$songId/vocals")({
  component: VocalsTab,
});

function VocalsTab() {
  const { songId } = Route.useParams();
  const { data } = useAssets({ songId });
  const vocals = (data ?? []).filter((a) => a.kind === "vocal");
  if (vocals.length === 0) {
    return (
      <EmptyState
        icon={<Mic2 className="h-5 w-5" />}
        title="No guide vocals yet"
        description="Generate a random or reference-conditioned guide vocal with Fish Speech 1.5."
        action={
          <Button asChild>
            <Link to="/vocals">Open Vocals</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {vocals.map((a) => (
        <AudioAssetCard key={a.id} asset={a} />
      ))}
    </div>
  );
}
