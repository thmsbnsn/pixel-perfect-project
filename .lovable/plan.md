
# Varynt Studio — UI Shell Plan

Build a desktop-first dark workstation for AI-assisted music production. All external actions go through a typed `StudioBridge`; only a `MockStudioBridge` ships in this phase.

## Scope

- Full app chrome (left sidebar, top bar, right-side global job drawer).
- 12 primary screens per brief.
- Typed domain model + `StudioBridge` interface + `MockStudioBridge` with deterministic seeded data and simulated 8–15s jobs (including one failed job for error-state review).
- Single global audio controller so only one clip plays at a time.
- Loading / empty / populated / disabled / recoverable-error / non-recoverable-error states on every major screen.
- No Supabase, no auth, no cloud, no payments. LocalStorage only for UI prefs (sidebar collapsed, theme density).

## Visual system

- Near-black charcoal background, layered graphite panels, subtle borders.
- Accents: electric violet (primary), cold cyan (active audio), muted amber (warnings), restrained green (success).
- Geometric sans (Space Grotesk + Inter tabular for numerics) loaded via `<link>` in `__root.tsx` head.
- Tokens added to `src/styles.css` (`@theme` + `:root`/`.dark`) as oklch semantic variables — no hardcoded colors in components.
- Wordmark: `VARYNT` bold + `STUDIO` small technical label.

## Route structure (TanStack Router, file-based)

```text
src/routes/
  __root.tsx                 # shell: sidebar + topbar + job drawer + <Outlet/>
  index.tsx                  # Dashboard (replaces placeholder)
  songs.tsx                  # Songs list (grid/table)
  songs.$songId.tsx          # Song workspace layout with tabs
    songs.$songId.index.tsx  # Overview
    songs.$songId.brief.tsx
    songs.$songId.generations.tsx
    songs.$songId.stems.tsx
    songs.$songId.vocals.tsx
    songs.$songId.reaper.tsx
    songs.$songId.mixes.tsx
    songs.$songId.masters.tsx
    songs.$songId.notes.tsx
  generate.tsx               # Generate workstation
  vocals.tsx                 # Fish Speech vocals
  stems.tsx                  # UVR shell
  library.tsx                # Audio library
  mix-review.tsx             # A/B review
  releases.tsx               # Release readiness
  system.tsx                 # Component status + diagnostics
  settings.tsx               # Settings sections
```

Each route sets its own `head()` title + description; no `og:image` (workstation app, not marketing).

## File layout (source)

```text
src/
  bridge/
    types.ts                 # SongProject, AudioAsset, StudioJob, VoiceProfile, ComponentStatus, inputs
    StudioBridge.ts          # interface
    MockStudioBridge.ts      # deterministic seeded impl + simulated jobs
    seed.ts                  # fixture songs/assets/jobs/profiles/status
    index.ts                 # exports singleton `bridge`
  state/
    jobs-store.ts            # zustand or plain React store: subscribes to bridge job stream
    audio-controller.ts      # single-play coordinator
    ui-prefs.ts              # sidebar collapsed, density
  components/
    shell/                   # Sidebar, Topbar, SongSwitcher, Breadcrumbs, JobDrawer, SystemFooter
    audio/                   # AudioPlayer, Waveform (canvas), CompareRow
    jobs/                    # JobRow, JobProgress, JobLogsSheet
    common/                  # Panel, StatCard, StatusBadge, EmptyState, ErrorState, LoadingSkeleton
    forms/                   # NewSongDialog, prompt chips, seed control
  features/
    dashboard/, songs/, generate/, vocals/, stems/, library/,
    mix-review/, releases/, system/, settings/, song-workspace/
  hooks/                     # useBridge, useJobs, useAudio, useSongs
  lib/                       # existing + format-duration, slugify
```

Shadcn primitives added on demand: `dialog`, `tabs`, `sheet`, `tooltip`, `dropdown-menu`, `select`, `slider`, `switch`, `checkbox`, `progress`, `badge`, `command`, `separator`, `scroll-area`, `input`, `textarea`, `toast`.

## Mock bridge behavior

- All methods return promises with 150–400ms latency.
- Job creation returns `queued`, then `running` with `progress` ticks every ~500ms, completing in 8–15s. Emits via a subscribable event bus consumed by the jobs store.
- Seeded fixtures per brief:
  - 3 songs at different stages (Brief / Selecting / Mixing).
  - 6 generations (MusicGen + Stable Audio), 2 Fish Speech outputs, 1 consented reference profile.
  - 1 completed stem job, 1 active MusicGen job, 1 failed Stable Audio job (`error.code = "hf_unauthorized"`, message: "Stable Audio access is not authorized. Accept the model terms in Hugging Face, then retry.").
  - 2 mix revisions on one song.
  - System status: MusicGen / Stable Audio Small / Fish Speech / FFmpeg = installed or available; UVR + REAPER = `unverified`; GPU = available (RTX 5060 Ti).
- Playable audio: use a small handful of short royalty-free CC0 sine/pink-noise clips bundled locally OR generate short WebAudio-rendered blobs at load time (no external URLs). Waveforms rendered from downsampled PCM.

## Key interaction rules

- Reference Voice generate button disabled until reference audio + exact transcript + consent checkbox all present.
- Stable Audio Medium never appears as a selectable option.
- Fish Speech pages always show CC BY-NC-SA 4.0 badge + consent reminder.
- Archive and cancel-active-job require confirmation dialogs; play/open do not.
- Sidebar collapsible to icons with tooltips preserved.
- Job drawer accessible from every route via topbar button; shows all jobs with cancel/retry/reveal/logs.
- Absolute paths (e.g., `C:\Varynt\...`) only appear in mock data / bridge responses, never hardcoded in components.

## Placeholder replacement

`src/routes/index.tsx` is rewritten as the Dashboard (the placeholder page IS the index; no sibling route added).

## Definition of done

Matches the 12-point checklist in the brief. A short `README.md` at project root documents run instructions, `StudioBridge` location, how to swap `MockStudioBridge` for a real local implementation, what remains mocked, and the route/component map.

## Out of scope (this phase)

Real Python/PowerShell bridge, actual model inference, real UVR/REAPER control, file-system writes, auth, cloud sync, distribution integrations.
