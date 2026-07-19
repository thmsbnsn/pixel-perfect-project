import { useQuery } from "@tanstack/react-query";
import { bridge } from "@/bridge";

export const songsKeys = {
  all: ["songs"] as const,
  detail: (id: string) => ["songs", id] as const,
};

export function useSongs() {
  return useQuery({ queryKey: songsKeys.all, queryFn: () => bridge.getSongs() });
}

export function useSong(id: string | undefined) {
  return useQuery({
    queryKey: id ? songsKeys.detail(id) : ["songs", "none"],
    queryFn: () => bridge.getSong(id as string),
    enabled: Boolean(id),
  });
}

export function useAssets(filters?: Parameters<typeof bridge.getAssets>[0]) {
  return useQuery({
    queryKey: ["assets", filters ?? {}],
    queryFn: () => bridge.getAssets(filters),
  });
}

export function useSystemStatus() {
  return useQuery({ queryKey: ["system-status"], queryFn: () => bridge.getSystemStatus() });
}

export function useVoiceProfiles() {
  return useQuery({ queryKey: ["voice-profiles"], queryFn: () => bridge.getVoiceProfiles() });
}
