import { useEffect, useState } from "react";
import { bridge } from "@/bridge";
import type { StudioJob } from "@/bridge/types";

let cache: StudioJob[] = [];
const listeners = new Set<(jobs: StudioJob[]) => void>();
let bootstrapped = false;

function publish() {
  listeners.forEach((l) => l(cache));
}

async function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;
  cache = await bridge.getJobs();
  publish();
  bridge.subscribeJobs((e) => {
    const idx = cache.findIndex((j) => j.id === e.job.id);
    if (e.kind === "removed") {
      cache = cache.filter((j) => j.id !== e.job.id);
    } else if (idx === -1) {
      cache = [e.job, ...cache];
    } else {
      cache = cache.map((j) => (j.id === e.job.id ? e.job : j));
    }
    publish();
  });
}

export function useJobs(): StudioJob[] {
  const [jobs, setJobs] = useState<StudioJob[]>(cache);
  useEffect(() => {
    bootstrap();
    const l = (j: StudioJob[]) => setJobs(j);
    listeners.add(l);
    setJobs(cache);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return jobs;
}

export function useActiveJobCount(): number {
  const jobs = useJobs();
  return jobs.filter((j) => j.status === "queued" || j.status === "running").length;
}
