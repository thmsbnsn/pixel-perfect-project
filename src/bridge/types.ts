export type SongStage =
  | "brief"
  | "generating"
  | "selecting"
  | "stems"
  | "arranging"
  | "vocals"
  | "mixing"
  | "mastering"
  | "complete"
  | "archived";

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type EngineId = "musicgen" | "stable-audio-3-small" | "fish-speech-1.5" | "uvr";
export type DeviceKind = "cpu" | "cuda";
export type ComponentState =
  | "installed"
  | "available"
  | "busy"
  | "unavailable"
  | "unverified"
  | "error";

export type AssetKind =
  | "generation"
  | "import"
  | "stem"
  | "reference"
  | "vocal"
  | "mix"
  | "master"
  | "sample";

export interface SongProject {
  id: string;
  title: string;
  slug: string;
  stage: SongStage;
  bpm?: number;
  key?: string;
  timeSignature: string;
  genreTags: string[];
  moodTags: string[];
  creativeBrief: string;
  structureTemplate?: string;
  targetDurationSeconds?: number;
  folderPath: string;
  createdAt: string;
  updatedAt: string;
  counts: {
    generations: number;
    stems: number;
    vocals: number;
    mixes: number;
    masters: number;
  };
}

export interface AudioAsset {
  id: string;
  songId?: string;
  name: string;
  kind: AssetKind;
  filePath: string;
  streamUrl?: string;
  durationSeconds?: number;
  sampleRate?: number;
  channels?: number;
  bpm?: number;
  key?: string;
  engine?: EngineId;
  model?: string;
  prompt?: string;
  seed?: number;
  favorite: boolean;
  createdAt: string;
  waveformPeaks?: number[];
}

export interface StudioJob {
  id: string;
  type: "music-generation" | "voice-generation" | "stem-separation" | "analysis" | "export";
  engine: EngineId;
  device: DeviceKind;
  songId?: string;
  title: string;
  prompt?: string;
  status: JobStatus;
  progress?: number;
  stageLabel: string;
  message?: string;
  outputAssetIds: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  logs: string[];
  error?: { code: string; message: string; recoverable: boolean };
}

export interface VoiceProfile {
  id: string;
  name: string;
  referenceAssetId: string;
  exactTranscript: string;
  consentConfirmed: boolean;
  createdAt: string;
}

export interface ComponentStatus {
  id: string;
  label: string;
  state: ComponentState;
  version?: string;
  device?: DeviceKind;
  message?: string;
  lastCheckedAt?: string;
}

export interface CreateSongInput {
  title: string;
  slug?: string;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  genreTags?: string[];
  moodTags?: string[];
  creativeBrief?: string;
  targetDurationSeconds?: number;
  structureTemplate?: string;
}

export interface UpdateSongInput extends Partial<CreateSongInput> {
  stage?: SongStage;
}

export interface AssetFilters {
  songId?: string;
  kind?: AssetKind;
  engine?: EngineId;
  favorite?: boolean;
  search?: string;
}

export interface ImportAudioInput {
  songId?: string;
  name: string;
  kind?: AssetKind;
}

export interface MusicGenJobInput {
  songId?: string;
  prompt: string;
  durationSeconds: number;
  variations: number;
  seed?: number;
  model?: string;
  outputPrefix?: string;
}

export interface StableAudioJobInput {
  songId?: string;
  prompt: string;
  durationSeconds: number;
  variations: number;
  seed?: number;
  outputPrefix?: string;
}

export interface FishSpeechJobInput {
  songId?: string;
  mode: "random" | "reference";
  text: string;
  referenceAssetId?: string;
  referenceTranscript?: string;
  voiceProfileName?: string;
  consentConfirmed?: boolean;
  seed?: number;
  outputFormat?: "wav" | "flac";
}

export interface StemJobInput {
  sourceAssetId: string;
  preset: string;
  stems: string[];
  outputPrefix?: string;
}

export interface CreateVoiceProfileInput {
  name: string;
  referenceAssetId: string;
  exactTranscript: string;
  consentConfirmed: boolean;
}
