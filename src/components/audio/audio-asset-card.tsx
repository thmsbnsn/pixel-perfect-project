import { Pause, Play, Star, StarOff, FolderOpen, Send, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/audio/waveform";
import { useAudio } from "@/hooks/use-audio";
import { formatDuration, relativeTime } from "@/lib/format";
import type { AudioAsset } from "@/bridge/types";
import { cn } from "@/lib/utils";
import { bridge } from "@/bridge";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function AudioAssetCard({
  asset,
  actions,
  compact = false,
}: {
  asset: AudioAsset;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  const { playingId, positionSec, durationSec, toggle } = useAudio();
  const qc = useQueryClient();
  const isPlaying = playingId === asset.id;
  const progress = isPlaying && durationSec > 0 ? positionSec / durationSec : 0;

  const onToggle = () =>
    toggle(asset.id, { seed: asset.seed, durationSec: asset.durationSeconds });

  const onFav = async () => {
    try {
      await bridge.toggleFavorite(asset.id);
      qc.invalidateQueries({ queryKey: ["assets"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update asset");
    }
  };

  const onReveal = async () => {
    try {
      await bridge.revealPath(asset.filePath);
      toast.success("Reveal requested", { description: asset.filePath });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reveal failed");
    }
  };

  return (
    <div
      className={cn(
        "group rounded-lg border border-border bg-surface-1 p-3 transition-colors",
        isPlaying && "border-audio/40 bg-audio/5",
      )}
    >
      <div className="flex items-start gap-3">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={isPlaying ? "default" : "secondary"}
                onClick={onToggle}
                aria-label={isPlaying ? `Pause ${asset.name}` : `Play ${asset.name}`}
                className={cn(isPlaying && "bg-audio text-primary-foreground hover:bg-audio/90")}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{asset.name}</p>
            {asset.engine ? (
              <span className="rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {asset.engine === "musicgen"
                  ? "MusicGen"
                  : asset.engine === "stable-audio-3-small"
                    ? "Stable Audio"
                    : asset.engine === "fish-speech-1.5"
                      ? "Fish Speech"
                      : asset.engine}
              </span>
            ) : null}
          </div>
          {asset.prompt ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{asset.prompt}</p>
          ) : null}
          <div className="mt-2">
            <Waveform peaks={asset.waveformPeaks} progress={progress} active={isPlaying} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground tabular">
            <span>
              {isPlaying
                ? `${formatDuration(positionSec)} / ${formatDuration(asset.durationSeconds)}`
                : formatDuration(asset.durationSeconds)}
            </span>
            <span className="flex items-center gap-2">
              {asset.seed != null ? <span>seed {asset.seed}</span> : null}
              <span>{relativeTime(asset.createdAt)}</span>
            </span>
          </div>
        </div>

        {!compact ? (
          <div className="flex flex-col items-end gap-1">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onFav}
                    aria-label={asset.favorite ? "Unfavorite" : "Favorite"}
                  >
                    {asset.favorite ? (
                      <Heart className="h-4 w-4 fill-primary text-primary" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{asset.favorite ? "Unfavorite" : "Favorite"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={onReveal} aria-label="Reveal in folder">
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reveal file</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : null}
      </div>

      {actions ? <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">{actions}</div> : null}
    </div>
  );
}

// Re-exports for icon consumers if needed
export { Star, StarOff, Send };
