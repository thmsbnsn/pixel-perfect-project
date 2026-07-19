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

export type JobEvent = { kind: "created" | "updated" | "removed"; job: StudioJob };

export type BridgeConnection = {
  connected: boolean;
  label: string;
};

export interface StudioBridge {
  getConnection(): BridgeConnection;

  getSystemStatus(): Promise<ComponentStatus[]>;
  refreshSystemStatus(): Promise<ComponentStatus[]>;

  getSongs(): Promise<SongProject[]>;
  getSong(songId: string): Promise<SongProject>;
  createSong(input: CreateSongInput): Promise<SongProject>;
  updateSong(songId: string, input: UpdateSongInput): Promise<SongProject>;
  archiveSong(songId: string): Promise<void>;

  getAssets(filters?: AssetFilters): Promise<AudioAsset[]>;
  getAsset(assetId: string): Promise<AudioAsset | undefined>;
  importAudio(input: ImportAudioInput): Promise<AudioAsset>;
  toggleFavorite(assetId: string): Promise<AudioAsset>;
  revealPath(path: string): Promise<void>;
  openReaper(songId: string): Promise<void>;
  openUvr(): Promise<void>;

  createMusicGenJob(input: MusicGenJobInput): Promise<StudioJob>;
  createStableAudioJob(input: StableAudioJobInput): Promise<StudioJob>;
  createFishSpeechJob(input: FishSpeechJobInput): Promise<StudioJob>;
  createStemJob(input: StemJobInput): Promise<StudioJob>;

  getJobs(): Promise<StudioJob[]>;
  getJob(jobId: string): Promise<StudioJob>;
  cancelJob(jobId: string): Promise<void>;
  retryJob(jobId: string): Promise<StudioJob>;

  getVoiceProfiles(): Promise<VoiceProfile[]>;
  createVoiceProfile(input: CreateVoiceProfileInput): Promise<VoiceProfile>;

  subscribeJobs(listener: (event: JobEvent) => void): () => void;
}
