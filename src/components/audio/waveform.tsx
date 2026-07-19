import { cn } from "@/lib/utils";

/**
 * Static waveform visual rendered from downsampled peaks.
 * Playhead is a positional overlay driven by parent props.
 */
export function Waveform({
  peaks,
  progress = 0,
  active = false,
  height = 40,
  className,
}: {
  peaks?: number[];
  progress?: number;
  active?: boolean;
  height?: number;
  className?: string;
}) {
  const bars = peaks ?? Array.from({ length: 64 }, (_, i) => 0.3 + 0.3 * Math.sin(i));
  const playHead = Math.max(0, Math.min(1, progress));
  return (
    <div
      className={cn("relative flex items-end gap-[2px] overflow-hidden rounded-sm", className)}
      style={{ height }}
      aria-hidden
    >
      {bars.map((v, i) => {
        const done = i / bars.length <= playHead;
        return (
          <span
            key={i}
            className={cn(
              "flex-1 rounded-[1px] transition-colors",
              done && active
                ? "bg-audio"
                : done
                  ? "bg-primary/80"
                  : "bg-foreground/25",
            )}
            style={{ height: `${Math.round(v * 100)}%` }}
          />
        );
      })}
    </div>
  );
}
