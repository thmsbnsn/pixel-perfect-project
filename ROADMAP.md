# Varynt Studio Roadmap

This is the implementation roadmap for turning the Lovable UI shell into a fully wired, local-first AI music workstation. It is a living document: check items off only after the installed Tauri application has passed the relevant end-to-end verification.

## Current foundation

- [x] Convert the Lovable shell into a Tauri 2 Windows application.
- [x] Build an NSIS installer and install Varynt Studio locally.
- [x] Connect native system-status checks for the GPU, model runtimes, FFmpeg, storage, and external applications.
- [x] Restrict Explorer reveals to paths inside `G:\AI-Band-Studio`.
- [x] Detect and allowlist REAPER at `G:\Software\REAPER\reaper.exe`.
- [x] Detect and allowlist UVR at `G:\Software\Ultimate Vocal Remover\UVR.exe`.
- [x] Detect and allowlist ComfyUI Desktop at `G:\Software\Comfy Desktop\Comfy Desktop.exe`.
- [x] Verify MusicGen, Stable Audio 3 Small-Music, and Fish Speech 1.5 runtimes independently.

## Definition of fully wired

Varynt Studio is fully wired when the installed desktop application can create and reopen persistent songs, run every supported model against real inputs, report and cancel live jobs, play and organize real audio files, exchange project assets with REAPER and UVR, persist settings and reviews, and build a verified release package without relying on seeded mock data or simulated actions.

## Phase 1 — Native application core (P0)

### Replace the mock bridge

- [ ] Stop `TauriStudioBridge` from inheriting production behavior from `MockStudioBridge`.
- [ ] Implement native song operations.
- [ ] Implement native audio-asset operations.
- [ ] Implement native generation-job operations.
- [ ] Implement native voice-profile operations.
- [ ] Implement native imports and favorites.
- [ ] Implement native settings operations.
- [ ] Remove seeded mock songs, jobs, paths, statuses, and assets from the installed desktop build.
- [ ] Keep the mock bridge available only for isolated browser development and UI review.

### Add persistent workspace storage

- [ ] Use `G:\AI-Band-Studio\04-Songs` as the song workspace.
- [ ] Define the song-folder layout and manifest schema.
- [ ] Persist song metadata, creative briefs, stages, and folder paths.
- [ ] Persist generation parameters, prompts, seeds, models, and outputs.
- [ ] Persist audio assets and physical file paths.
- [ ] Persist jobs, logs, and failure details.
- [ ] Persist voice profiles, exact transcripts, and consent records.
- [ ] Persist favorites, mix notes, release metadata, and application settings.
- [ ] Add schema versioning and migrations.
- [ ] Rebuild the application state correctly after a restart.

### Build the native job manager

- [ ] Queue model and audio-processing jobs in Rust.
- [ ] Spawn PowerShell and Python runners without opening console windows.
- [ ] Pass user inputs as separate process arguments, never interpolated shell commands.
- [ ] Capture stdout and stderr into structured job logs.
- [ ] Emit live created, updated, completed, failed, and cancelled events to React.
- [ ] Track child process IDs and terminate complete process trees on cancellation.
- [ ] Retry failed jobs using their original validated inputs.
- [ ] Recover or mark interrupted jobs after an application restart.
- [ ] Prevent conflicting CUDA jobs from running simultaneously.
- [ ] Allow safe CPU work alongside GPU work when system resources permit.
- [ ] Preserve actionable diagnostics for every job.

## Phase 2 — Real model integrations (P0)

### MusicGen

- [ ] Connect the Generate screen to `Generate-MusicGen.ps1`.
- [ ] Support prompt, duration, model, seed, and output prefix.
- [ ] Implement multiple variations as distinct outputs.
- [ ] Save outputs to the selected song or the shared generation library.
- [ ] Report model loading and generation progress.
- [ ] Support cancellation and retry.
- [ ] Register completed WAV files as audio assets.
- [ ] Surface CUDA, checkpoint, FFmpeg, and out-of-memory errors clearly.
- [ ] Pass an installed-app end-to-end test: Generate -> progress -> WAV -> playback -> reveal.

### Stable Audio 3 Small-Music

- [ ] Connect the Generate screen to `Generate-StableAudio3.ps1`.
- [ ] Align seed behavior between the UI and runner, or remove the unsupported control.
- [ ] Support multiple variations.
- [ ] Save and register outputs in the selected song.
- [ ] Display the verified CPU execution route accurately.
- [ ] Capture checkpoint and Hugging Face access failures.
- [ ] Prevent unsupported Stable Audio variants from being selected.
- [ ] Support progress, cancellation, and retry.
- [ ] Pass an installed-app end-to-end generation test.

### Fish Speech 1.5

- [ ] Connect the Vocals screen to `Generate-FishSpeech.ps1`.
- [ ] Support random-voice generation.
- [ ] Support reference-conditioned generation.
- [ ] Resolve reference asset IDs to physical audio files.
- [ ] Require and validate the exact reference transcript.
- [ ] Persist consent confirmation with the voice profile and output.
- [ ] Persist reusable voice profiles.
- [ ] Align WAV/FLAC behavior between the UI and runner.
- [ ] Support progress, cancellation, and retry.
- [ ] Keep the noncommercial Fish Speech license visible on profiles and outputs.
- [ ] Pass installed-app tests for random and reference-conditioned generation.

### UVR stem separation

- [ ] Determine and document whether the installed UVR build exposes a stable CLI.
- [ ] Create a repeatable UVR separation runner.
- [ ] Map Varynt presets to installed UVR models.
- [ ] Pass the selected source asset and validated output destination.
- [ ] Generate and register vocals, drums, bass, and other stems.
- [ ] Preserve source sample rate and bit depth when possible.
- [ ] Report progress and support cancellation and retry.
- [ ] Fall back to opening UVR manually when automation is unavailable.
- [ ] Pass an installed-app end-to-end stem-separation test.

## Phase 3 — Real audio and files (P0)

### Replace synthetic playback

- [ ] Replace generated WebAudio tones with playback of actual local files.
- [ ] Expose secure Tauri asset URLs limited to approved workspace roots.
- [ ] Implement play, pause, stop, seek, and completion behavior.
- [ ] Preserve the single-active-player rule.
- [ ] Read accurate duration, sample rate, channel count, and format metadata.
- [ ] Generate and cache waveform peaks.
- [ ] Support WAV, FLAC, MP3, and AIFF where the local decoder permits.
- [ ] Handle moved, missing, corrupt, and unsupported files gracefully.

### Native audio import

- [ ] Replace the mock Import action with a native Windows file picker.
- [ ] Validate supported audio formats before import.
- [ ] Let the user copy files into the workspace or link to approved locations.
- [ ] Select the destination song and asset type.
- [ ] Extract audio metadata and waveform data.
- [ ] Detect duplicate files.
- [ ] Support reference-audio classification for Fish Speech.
- [ ] Register imported assets persistently.

## Phase 4 — Song production workflow (P1)

### Song management

- [ ] Create a real song folder and manifest from the New Song dialog.
- [ ] Load and edit real song metadata and creative briefs.
- [ ] Validate slugs and prevent folder collisions.
- [ ] Calculate asset counts from persistent records and files.
- [ ] Archive songs safely into `G:\AI-Band-Studio\09-Archive`.
- [ ] Restore archived songs without losing metadata.
- [ ] Reveal the actual song folder in Explorer.

### REAPER integration

- [ ] Define and version a Varynt REAPER project template.
- [ ] Create or update a song-specific `.rpp` project.
- [ ] Set BPM, time signature, and song-section markers.
- [ ] Import approved generations and stems onto organized tracks.
- [ ] Configure basic routing and naming conventions.
- [ ] Open the correct song project instead of launching REAPER generically.
- [ ] Detect or import REAPER mix bounces back into Varynt.
- [ ] Pass an installed-app round trip: Varynt -> REAPER -> mix bounce -> Varynt.

### ComfyUI integration

- [ ] Define ComfyUI's initial role: cover art, artist imagery, release graphics, or visualizers.
- [ ] Add an Open ComfyUI action to the desktop UI.
- [ ] Store approved ComfyUI workflow JSON files in the workspace.
- [ ] Connect to the local ComfyUI API.
- [ ] Submit prompts and workflow inputs.
- [ ] Monitor queue and generation progress.
- [ ] Import completed images into the song or release workspace.
- [ ] Preserve prompts, workflow version, seed, and provenance.

### Persistent settings

- [ ] Persist the workspace root.
- [ ] Persist editable REAPER, UVR, and ComfyUI executable paths.
- [ ] Persist model and cache locations.
- [ ] Persist generation defaults and output destinations.
- [ ] Persist concurrency and resource limits.
- [ ] Persist audio-output preferences.
- [ ] Persist UI density, theme, and reduced-motion preferences.
- [ ] Replace the Settings mock notice and mock Save action.

## Phase 5 — Review, mastering, and release (P1)

### Mix review

- [ ] Discover or import REAPER mix bounces.
- [ ] Implement synchronized A/B playback and seeking.
- [ ] Add optional loudness matching.
- [ ] Persist timestamped review notes.
- [ ] Persist approval and rejection state.
- [ ] Promote an approved mix into the mastering workflow.
- [ ] Replace every mock mix-review action.

### Mastering and analysis

- [ ] Measure integrated LUFS and true peak.
- [ ] Measure dynamic range and detect clipping.
- [ ] Validate sample rate and bit depth.
- [ ] Add stereo and mono compatibility checks.
- [ ] Support reference-track comparison.
- [ ] Track multiple master versions and approval state.

### Release packaging

- [ ] Persist release title, artist, credits, identifiers, and notes.
- [ ] Select and validate final masters.
- [ ] Attach artwork and provenance.
- [ ] Include instrumental and alternate versions when selected.
- [ ] Produce a model/license/provenance report.
- [ ] Create a deterministic release-export folder.
- [ ] Generate checksums for packaged deliverables.
- [ ] Enforce a final readiness checklist.
- [ ] Replace mock release-note and export-package actions.

## Phase 6 — Reliability, security, and distribution (P2)

### Security and process safety

- [ ] Keep generated outputs inside approved workspace roots.
- [ ] Canonicalize and validate every filesystem path received from the UI.
- [ ] Keep executable launching strictly allowlisted.
- [ ] Validate imported file types and sizes.
- [ ] Redact tokens and sensitive values from logs.
- [ ] Handle disconnected or unavailable workspace drives safely.
- [ ] Document the local trust boundary and supported external tools.

### Recovery and operational behavior

- [ ] Detect orphaned jobs and processes after crashes.
- [ ] Clean temporary generation artifacts without deleting approved outputs.
- [ ] Preserve partial logs and meaningful failure details.
- [ ] Avoid overwriting existing files.
- [ ] Detect low disk space before starting large jobs.
- [ ] Detect missing models or dependencies before queueing.
- [ ] Add native completion and failure notifications.

### Automated verification

- [ ] Add Rust tests for path validation and process-command construction.
- [ ] Add bridge contract tests.
- [ ] Add persistence and migration tests.
- [ ] Add process cancellation and retry tests.
- [ ] Add React interaction tests for each major workflow.
- [ ] Add focused real-runtime smoke tests for MusicGen, Stable Audio, Fish Speech, and UVR.
- [ ] Add an installed-app launch, upgrade, and persistence test.
- [ ] Keep type-check, lint, frontend build, Cargo checks, and Tauri build green.

### Packaging and upgrades

- [ ] Replace default Tauri icons with final Varynt branding.
- [ ] Add installer publisher and product metadata.
- [ ] Code-sign the executable and installer.
- [ ] Establish application versioning and data migrations.
- [ ] Preserve workspace settings during upgrades.
- [ ] Verify Start Menu and uninstall behavior.
- [ ] Define a repeatable release and update process.

## Recommended execution order

1. Native job manager.
2. Persistent songs and assets.
3. MusicGen end to end.
4. Real local audio playback.
5. Stable Audio 3 Small-Music.
6. Fish Speech 1.5.
7. Native audio import.
8. UVR stem separation.
9. REAPER project generation and bounce round trip.
10. Persistent settings.
11. Mix review, mastering, and release packaging.
12. ComfyUI workflow integration.
13. Reliability, automated verification, signing, and upgrades.

## First usable milestone

The first major milestone is complete when a user can create a persistent song, submit a real MusicGen job from the installed application, watch its live progress, cancel or retry it, receive a registered WAV in the song folder, play that actual file in Varynt Studio, reveal it in Explorer, close the app, and reopen it without losing the song, asset, or job history.
