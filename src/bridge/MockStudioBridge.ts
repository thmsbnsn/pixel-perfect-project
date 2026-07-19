import type {
  AssetFilters,
  AudioAsset,
  ComponentStatus,
  CreateSongInput,
  CreateVoiceProfileInput,
  FishSpeechJobInput,
  ImportAudioInput,
  MusicGenJobInput,
  SongProject,
  StableAudioJobInput,
  StemJobInput,
  StudioJob,
  UpdateSongInput,
  VoiceProfile,
} from "./types";
import type { BridgeConnection, JobEvent, StudioBridge } from "./StudioBridge";
import {
  SEED_ASSETS,
  SEED_JOBS,
  SEED_SONGS,
  SEED_STATUS,
  SEED_VOICE_PROFILES,
  makePeaks,
} from "./seed";

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
function nowIso() {
  return new Date().toISOString();
}
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function jitter(base = 250) {
  return base + Math.floor(Math.random() * 200);
}
function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export class MockStudioBridge implements StudioBridge {
  private songs = new Map<string, SongProject>();
  private assets = new Map<string, AudioAsset>();
  private jobs = new Map<string, StudioJob>();
  private profiles = new Map<string, VoiceProfile>();
  private status: ComponentStatus[] = SEED_STATUS.map((s) => ({ ...s }));
  private listeners = new Set<(e: JobEvent) => void>();
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private connection: BridgeConnection = { connected: true, label: "Mock bridge" };

  constructor() {
    SEED_SONGS.forEach((s) => this.songs.set(s.id, { ...s }));
    SEED_ASSETS.forEach((a) => this.assets.set(a.id, { ...a }));
    SEED_JOBS.forEach((j) => this.jobs.set(j.id, { ...j }));
    SEED_VOICE_PROFILES.forEach((p) => this.profiles.set(p.id, { ...p }));
    // Continue simulating the pre-seeded active job so a live progress bar
    // is visible immediately after mount.
    const active = this.jobs.get("job_active_musicgen");
    if (active && active.status === "running") this.simulate(active.id, 12_000);
  }

  getConnection() {
    return this.connection;
  }

  // ─── System ──────────────────────────────────────────
  async getSystemStatus() {
    await delay(jitter(180));
    return this.status.map((s) => ({ ...s }));
  }
  async refreshSystemStatus() {
    await delay(600);
    this.status = this.status.map((s) => ({ ...s, lastCheckedAt: nowIso() }));
    return this.status.map((s) => ({ ...s }));
  }

  // ─── Songs ───────────────────────────────────────────
  async getSongs() {
    await delay(jitter(200));
    return Array.from(this.songs.values())
      .filter((s) => s.stage !== "archived")
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map((s) => ({ ...s }));
  }
  async getSong(id: string) {
    await delay(jitter(150));
    const s = this.songs.get(id);
    if (!s) throw new Error(`Song not found: ${id}`);
    return { ...s };
  }
  async createSong(input: CreateSongInput) {
    await delay(jitter(300));
    const id = uid("song");
    const slug = input.slug?.trim() || slugify(input.title);
    const s: SongProject = {
      id,
      title: input.title,
      slug,
      stage: "brief",
      bpm: input.bpm,
      key: input.key,
      timeSignature: input.timeSignature ?? "4/4",
      genreTags: input.genreTags ?? [],
      moodTags: input.moodTags ?? [],
      creativeBrief: input.creativeBrief ?? "",
      structureTemplate: input.structureTemplate,
      targetDurationSeconds: input.targetDurationSeconds,
      folderPath: `D:\\Varynt\\Projects\\${slug}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      counts: { generations: 0, stems: 0, vocals: 0, mixes: 0, masters: 0 },
    };
    this.songs.set(id, s);
    return { ...s };
  }
  async updateSong(id: string, input: UpdateSongInput) {
    await delay(jitter(200));
    const s = this.songs.get(id);
    if (!s) throw new Error(`Song not found: ${id}`);
    const next: SongProject = { ...s, ...input, updatedAt: nowIso() };
    this.songs.set(id, next);
    return { ...next };
  }
  async archiveSong(id: string) {
    await delay(jitter(200));
    const s = this.songs.get(id);
    if (!s) return;
    this.songs.set(id, { ...s, stage: "archived", updatedAt: nowIso() });
  }

  // ─── Assets ──────────────────────────────────────────
  async getAssets(filters?: AssetFilters) {
    await delay(jitter(180));
    let list = Array.from(this.assets.values());
    if (filters?.songId) list = list.filter((a) => a.songId === filters.songId);
    if (filters?.kind) list = list.filter((a) => a.kind === filters.kind);
    if (filters?.engine) list = list.filter((a) => a.engine === filters.engine);
    if (filters?.favorite) list = list.filter((a) => a.favorite);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.prompt ?? "").toLowerCase().includes(q),
      );
    }
    return list
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((a) => ({ ...a }));
  }
  async getAsset(id: string) {
    await delay(80);
    const a = this.assets.get(id);
    return a ? { ...a } : undefined;
  }
  async importAudio(input: ImportAudioInput) {
    await delay(jitter(250));
    const id = uid("asset");
    const a: AudioAsset = {
      id,
      songId: input.songId,
      name: input.name,
      kind: input.kind ?? "import",
      filePath: `D:\\Varynt\\Imports\\${input.name}`,
      durationSeconds: 20 + Math.floor(Math.random() * 40),
      favorite: false,
      createdAt: nowIso(),
      waveformPeaks: makePeaks(Math.floor(Math.random() * 999)),
    };
    this.assets.set(id, a);
    return { ...a };
  }
  async toggleFavorite(id: string) {
    await delay(60);
    const a = this.assets.get(id);
    if (!a) throw new Error("Asset not found");
    const next = { ...a, favorite: !a.favorite };
    this.assets.set(id, next);
    return { ...next };
  }
  async revealPath(_path: string) {
    await delay(120);
  }
  async openReaper(_songId: string) {
    await delay(200);
    throw new Error(
      "REAPER application path is not configured. Set it in Settings → External app paths.",
    );
  }
  async openUvr() {
    await delay(200);
    throw new Error(
      "UVR was not found. Set its application path in Settings → External app paths.",
    );
  }

  // ─── Jobs ────────────────────────────────────────────
  async getJobs() {
    await delay(jitter(150));
    return Array.from(this.jobs.values())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((j) => ({ ...j, logs: [...j.logs], outputAssetIds: [...j.outputAssetIds] }));
  }
  async getJob(id: string) {
    await delay(60);
    const j = this.jobs.get(id);
    if (!j) throw new Error("Job not found");
    return { ...j, logs: [...j.logs], outputAssetIds: [...j.outputAssetIds] };
  }
  async cancelJob(id: string) {
    const j = this.jobs.get(id);
    if (!j) return;
    this.clearTimer(id);
    const next: StudioJob = {
      ...j,
      status: "cancelled",
      stageLabel: "Cancelled",
      completedAt: nowIso(),
      logs: [...j.logs, "[job] cancelled by user."],
    };
    this.jobs.set(id, next);
    this.emit({ kind: "updated", job: next });
  }
  async retryJob(id: string) {
    const j = this.jobs.get(id);
    if (!j) throw new Error("Job not found");
    const cloned: StudioJob = {
      ...j,
      id: uid("job"),
      status: "queued",
      progress: 0,
      stageLabel: "Queued",
      outputAssetIds: [],
      error: undefined,
      createdAt: nowIso(),
      startedAt: undefined,
      completedAt: undefined,
      logs: ["[job] retry queued."],
    };
    this.jobs.set(cloned.id, cloned);
    this.emit({ kind: "created", job: cloned });
    this.simulate(cloned.id, 10_000);
    return { ...cloned };
  }

  async createMusicGenJob(input: MusicGenJobInput) {
    return this.startJob({
      type: "music-generation",
      engine: "musicgen",
      device: "cuda",
      songId: input.songId,
      title: `MusicGen — ${input.prompt.slice(0, 40)}${input.prompt.length > 40 ? "…" : ""}`,
      prompt: input.prompt,
      duration: 9_000 + Math.floor(Math.random() * 5_000),
      outputCount: input.variations,
    });
  }
  async createStableAudioJob(input: StableAudioJobInput) {
    return this.startJob({
      type: "music-generation",
      engine: "stable-audio-3-small",
      device: "cpu",
      songId: input.songId,
      title: `Stable Audio — ${input.prompt.slice(0, 40)}${input.prompt.length > 40 ? "…" : ""}`,
      prompt: input.prompt,
      duration: 11_000 + Math.floor(Math.random() * 4_000),
      outputCount: input.variations,
    });
  }
  async createFishSpeechJob(input: FishSpeechJobInput) {
    if (input.mode === "reference") {
      if (!input.referenceAssetId || !input.referenceTranscript || !input.consentConfirmed) {
        throw new Error(
          "Reference audio, exact transcript, and consent confirmation are required.",
        );
      }
    }
    return this.startJob({
      type: "voice-generation",
      engine: "fish-speech-1.5",
      device: "cuda",
      songId: input.songId,
      title: `Fish Speech — ${input.mode === "random" ? "random voice" : "reference voice"}`,
      prompt: input.text.slice(0, 80),
      duration: 8_000 + Math.floor(Math.random() * 3_000),
      outputCount: 1,
      assetKind: "vocal",
    });
  }
  async createStemJob(input: StemJobInput) {
    return this.startJob({
      type: "stem-separation",
      engine: "uvr",
      device: "cuda",
      title: `UVR — ${input.preset} → ${input.stems.length} stems`,
      duration: 10_000,
      outputCount: input.stems.length,
      assetKind: "stem",
    });
  }

  // ─── Voice profiles ──────────────────────────────────
  async getVoiceProfiles() {
    await delay(120);
    return Array.from(this.profiles.values()).map((p) => ({ ...p }));
  }
  async createVoiceProfile(input: CreateVoiceProfileInput) {
    if (!input.consentConfirmed) {
      throw new Error("Consent confirmation is required to save a voice profile.");
    }
    await delay(200);
    const p: VoiceProfile = {
      id: uid("vp"),
      name: input.name,
      referenceAssetId: input.referenceAssetId,
      exactTranscript: input.exactTranscript,
      consentConfirmed: true,
      createdAt: nowIso(),
    };
    this.profiles.set(p.id, p);
    return { ...p };
  }

  // ─── Events ──────────────────────────────────────────
  subscribeJobs(listener: (event: JobEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private emit(e: JobEvent) {
    this.listeners.forEach((l) => l(e));
  }
  private clearTimer(id: string) {
    const t = this.timers.get(id);
    if (t) clearInterval(t);
    this.timers.delete(id);
  }

  // ─── Job simulation ──────────────────────────────────
  private async startJob(spec: {
    type: StudioJob["type"];
    engine: StudioJob["engine"];
    device: StudioJob["device"];
    songId?: string;
    title: string;
    prompt?: string;
    duration: number;
    outputCount: number;
    assetKind?: AudioAsset["kind"];
  }): Promise<StudioJob> {
    await delay(150);
    const id = uid("job");
    const job: StudioJob = {
      id,
      type: spec.type,
      engine: spec.engine,
      device: spec.device,
      songId: spec.songId,
      title: spec.title,
      prompt: spec.prompt,
      status: "queued",
      progress: 0,
      stageLabel: "Queued",
      outputAssetIds: [],
      createdAt: nowIso(),
      logs: [
        `[queue] created (${spec.engine}, ${spec.device.toUpperCase()}).`,
      ],
    };
    this.jobs.set(id, job);
    this.emit({ kind: "created", job });
    this.simulate(id, spec.duration, spec.outputCount, spec.assetKind);
    return { ...job };
  }

  private simulate(
    id: string,
    duration: number,
    outputs = 1,
    assetKind: AudioAsset["kind"] = "generation",
  ) {
    const started = Date.now();
    const tickMs = 500;
    const stages = ["Loading model", "Preparing", "Rendering", "Post-processing", "Writing"];
    let stageIdx = 0;
    // Kick off "running"
    const j0 = this.jobs.get(id);
    if (j0 && j0.status === "queued") {
      const next: StudioJob = {
        ...j0,
        status: "running",
        startedAt: nowIso(),
        stageLabel: stages[0],
        progress: 0.02,
        logs: [...j0.logs, `[job] running on ${j0.device.toUpperCase()}.`],
      };
      this.jobs.set(id, next);
      this.emit({ kind: "updated", job: next });
    }
    const interval = setInterval(() => {
      const j = this.jobs.get(id);
      if (!j || j.status !== "running") {
        this.clearTimer(id);
        return;
      }
      const elapsed = Date.now() - started;
      const progress = Math.min(0.98, elapsed / duration);
      const nextStageIdx = Math.min(stages.length - 1, Math.floor(progress * stages.length));
      const logs = [...j.logs];
      if (nextStageIdx !== stageIdx) {
        stageIdx = nextStageIdx;
        logs.push(`[stage] ${stages[stageIdx]}…`);
      }
      const next: StudioJob = {
        ...j,
        progress,
        stageLabel: stages[stageIdx],
        logs,
      };
      this.jobs.set(id, next);
      this.emit({ kind: "updated", job: next });
      if (elapsed >= duration) {
        this.finishJob(id, outputs, assetKind);
      }
    }, tickMs);
    this.timers.set(id, interval);
  }

  private finishJob(id: string, outputs: number, assetKind: AudioAsset["kind"]) {
    this.clearTimer(id);
    const j = this.jobs.get(id);
    if (!j) return;
    const outputAssetIds: string[] = [];
    for (let i = 0; i < outputs; i++) {
      const aid = uid("asset");
      const seedNum = Math.floor(Math.random() * 99999);
      const asset: AudioAsset = {
        id: aid,
        songId: j.songId,
        name: `${j.engine}-${j.id.slice(-4)}-${i + 1}.wav`,
        kind: assetKind,
        filePath: `D:\\Varynt\\Projects\\_out\\${j.engine}-${j.id.slice(-4)}-${i + 1}.wav`,
        durationSeconds: 12 + Math.floor(Math.random() * 28),
        engine: j.engine,
        model: j.engine === "musicgen" ? "small" : undefined,
        prompt: j.prompt,
        seed: seedNum,
        favorite: false,
        createdAt: nowIso(),
        waveformPeaks: makePeaks(seedNum),
      };
      this.assets.set(aid, asset);
      outputAssetIds.push(aid);
    }
    const next: StudioJob = {
      ...j,
      status: "completed",
      progress: 1,
      stageLabel: "Complete",
      completedAt: nowIso(),
      outputAssetIds,
      logs: [...j.logs, `[done] produced ${outputs} asset${outputs === 1 ? "" : "s"}.`],
    };
    this.jobs.set(id, next);
    this.emit({ kind: "updated", job: next });
    if (j.songId) {
      const s = this.songs.get(j.songId);
      if (s) {
        const counts = { ...s.counts };
        if (assetKind === "stem") counts.stems += outputs;
        else if (assetKind === "vocal") counts.vocals += outputs;
        else counts.generations += outputs;
        this.songs.set(s.id, { ...s, counts, updatedAt: nowIso() });
      }
    }
  }
}
