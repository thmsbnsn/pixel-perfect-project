import { MockStudioBridge } from "./MockStudioBridge";
import { isTauri } from "@tauri-apps/api/core";
import type { StudioBridge } from "./StudioBridge";
import { TauriStudioBridge } from "./TauriStudioBridge";

// Single app-wide bridge instance. Swap MockStudioBridge with a real
// local implementation when the Python/PowerShell adapter is available.
export const bridge: StudioBridge = isTauri() ? new TauriStudioBridge() : new MockStudioBridge();

export * from "./types";
export type { StudioBridge, JobEvent, BridgeConnection } from "./StudioBridge";
