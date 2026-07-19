import { MockStudioBridge } from "./MockStudioBridge";
import type { StudioBridge } from "./StudioBridge";

// Single app-wide bridge instance. Swap MockStudioBridge with a real
// local implementation when the Python/PowerShell adapter is available.
export const bridge: StudioBridge = new MockStudioBridge();

export * from "./types";
export type { StudioBridge, JobEvent, BridgeConnection } from "./StudioBridge";
