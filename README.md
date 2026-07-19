# Varynt Studio — UI Shell

A local desktop-first workstation for AI-assisted alternative metal, metalcore,
electronic, and hip-hop production. This repository is a **Tauri 2 desktop
shell**. Every external action is routed through a typed adapter. Browser
development uses the deterministic `MockStudioBridge`; the Windows build uses
`TauriStudioBridge` for native system checks, workspace reveals, and approved
external-app launches. There is no cloud, auth, or billing.

## Running

```bash
bun install
bun run dev
```

The browser dev server binds to `127.0.0.1:1420` and uses mock data.

Run the native desktop app:

```bash
bun run desktop:dev
```

Create the Windows executable and NSIS installer:

```bash
bun run desktop:build
```

Build output is written beneath `src-tauri/target/release/`, with the installer
in `src-tauri/target/release/bundle/nsis/`.

## Where the bridge lives

- `src/bridge/types.ts` — every domain type (`SongProject`, `AudioAsset`,
  `StudioJob`, `VoiceProfile`, `ComponentStatus`, inputs).
- `src/bridge/StudioBridge.ts` — the typed adapter interface used by every
  screen. Anything the UI cannot do in the browser goes through this contract.
- `src/bridge/MockStudioBridge.ts` — deterministic implementation with
  simulated 8–15 s jobs, seeded fixtures, and one failed job so error states
  are visible during review.
- `src/bridge/seed.ts` — the seed songs, assets, jobs, voice profiles, and
  component status the mock returns.
- `src/bridge/index.ts` — exposes the singleton `bridge`.
- `src/bridge/TauriStudioBridge.ts` — desktop adapter for native Tauri commands.
- `src-tauri/src/lib.rs` — allowlisted Windows filesystem and application
  commands plus local runtime detection.

## Swapping in a real bridge

1. Add native, allowlisted commands for MusicGen, Stable Audio, Fish Speech,
   and UVR to `src-tauri/src/lib.rs`.
2. Override the corresponding `StudioBridge` methods in
   `src/bridge/TauriStudioBridge.ts`. Nothing else in the app should need to
   change.
3. Emit job progress so the global job drawer and dashboard reflect live
   status.

## What is still mocked

- Generation jobs (MusicGen, Stable Audio, Fish Speech, UVR) are not wired to
  the native runners yet.
- Settings persistence and imports.
- Audio preview: synthesized WebAudio tones stand in for real files so
  playback controls are auditable end-to-end without shipping binaries.

## Route and component structure

```
src/routes/
  __root.tsx                # sidebar + topbar + job drawer + <Outlet/>
  index.tsx                 # Dashboard
  songs.tsx                 # Songs list (grid + table)
  songs.$songId.tsx         # Song workspace shell with tab bar
    songs.$songId.index.tsx      # Overview + pipeline
    songs.$songId.brief.tsx
    songs.$songId.generations.tsx
    songs.$songId.stems.tsx
    songs.$songId.vocals.tsx
    songs.$songId.reaper.tsx
    songs.$songId.mixes.tsx
    songs.$songId.masters.tsx
    songs.$songId.notes.tsx
  generate.tsx              # MusicGen + Stable Audio workstation
  vocals.tsx                # Fish Speech guide vocals
  stems.tsx                 # UVR stem separation shell
  library.tsx               # Workspace audio browser
  mix-review.tsx            # A/B mix comparison
  releases.tsx              # Release readiness
  system.tsx                # Component status + diagnostics
  settings.tsx              # Workspace, defaults, external apps

src/components/
  shell/                    # Sidebar, top bar, job drawer
  audio/                    # Waveform + asset player card
  common/                   # Panel, EmptyState, ErrorState, StatusBadge
  ui/                       # shadcn primitives

src/features/
  songs/                    # New-song dialog

src/state/
  jobs-store.ts             # subscribes to bridge job events
  audio-controller.ts       # single-play audio coordinator

src/hooks/
  use-bridge.ts             # TanStack Query wrappers
  use-audio.ts              # subscribes to audio-controller
```

## Compliance and safety rails

- Fish Speech screens always show the `CC BY-NC-SA 4.0` badge, the consent
  reminder, and disable **Generate** in Reference-Voice mode until reference
  audio, an exact transcript, and consent are all present.
- Stable Audio Medium is not selectable.
- Windows-style paths appear only in mock data and bridge responses, never in
  reusable UI components.
- Confirmation dialogs guard archive and job-cancel actions; playback and
  panel toggles are frictionless.
- Only one audio preview may play at a time.
