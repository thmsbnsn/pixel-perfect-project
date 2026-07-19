import { invoke } from "@tauri-apps/api/core";

import { MockStudioBridge } from "./MockStudioBridge";
import type { BridgeConnection } from "./StudioBridge";
import type { ComponentStatus } from "./types";

export class TauriStudioBridge extends MockStudioBridge {
  private readonly desktopConnection: BridgeConnection = {
    connected: true,
    label: "Tauri desktop bridge",
  };

  override getConnection() {
    return this.desktopConnection;
  }

  override async getSystemStatus(): Promise<ComponentStatus[]> {
    return invoke<ComponentStatus[]>("get_system_status");
  }

  override async refreshSystemStatus(): Promise<ComponentStatus[]> {
    return this.getSystemStatus();
  }

  override async revealPath(path: string): Promise<void> {
    await invoke("reveal_path", { path });
  }

  override async openReaper(_songId: string): Promise<void> {
    await invoke("launch_external_app", { app: "reaper" });
  }

  override async openUvr(): Promise<void> {
    await invoke("launch_external_app", { app: "uvr" });
  }
}
