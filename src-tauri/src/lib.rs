use serde::Serialize;
use std::{
    env,
    path::{Path, PathBuf},
    process::Command,
};

const DEFAULT_WORKSPACE_ROOT: &str = r"G:\AI-Band-Studio";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ComponentStatus {
    id: String,
    label: String,
    state: String,
    version: Option<String>,
    device: Option<String>,
    message: Option<String>,
    last_checked_at: Option<String>,
}

fn workspace_root() -> PathBuf {
    env::var_os("VARYNT_WORKSPACE_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(DEFAULT_WORKSPACE_ROOT))
}

fn status(
    id: &str,
    label: &str,
    state: &str,
    version: Option<&str>,
    device: Option<&str>,
    message: Option<String>,
) -> ComponentStatus {
    ComponentStatus {
        id: id.into(),
        label: label.into(),
        state: state.into(),
        version: version.map(Into::into),
        device: device.map(Into::into),
        message,
        last_checked_at: None,
    }
}

fn exists_from_root(relative: &str) -> bool {
    workspace_root().join(relative).is_file()
}

fn command_output(program: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(program).args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }
    String::from_utf8(output.stdout)
        .ok()
        .map(|value| value.trim().to_string())
}

fn find_external_app(app: &str) -> Option<PathBuf> {
    let local_app_data = env::var_os("LOCALAPPDATA").map(PathBuf::from);
    let candidates: Vec<PathBuf> = match app {
        "reaper" => vec![
            PathBuf::from(r"G:\Software\REAPER\reaper.exe"),
            PathBuf::from(r"C:\Program Files\REAPER (x64)\reaper.exe"),
            PathBuf::from(r"C:\Program Files\REAPER\reaper.exe"),
        ],
        "uvr" => {
            let mut paths = vec![
                PathBuf::from(r"G:\Software\Ultimate Vocal Remover\UVR.exe"),
                PathBuf::from(r"C:\Program Files\Ultimate Vocal Remover\UVR.exe"),
                PathBuf::from(
                    r"C:\Program Files\Ultimate Vocal Remover\Ultimate Vocal Remover.exe",
                ),
            ];
            if let Some(base) = local_app_data {
                paths.push(base.join(r"Programs\Ultimate Vocal Remover\UVR.exe"));
            }
            paths
        }
        "comfyui" => vec![PathBuf::from(
            r"G:\Software\Comfy Desktop\Comfy Desktop.exe",
        )],
        _ => vec![],
    };
    candidates.into_iter().find(|path| path.is_file())
}

#[tauri::command]
fn get_workspace_root() -> String {
    workspace_root().to_string_lossy().into_owned()
}

#[tauri::command]
fn get_system_status() -> Vec<ComponentStatus> {
    let mut statuses = vec![status(
        "bridge",
        "Tauri desktop bridge",
        "installed",
        Some(env!("CARGO_PKG_VERSION")),
        None,
        Some("Native Rust bridge connected.".into()),
    )];

    let gpu = command_output(
        "nvidia-smi",
        &[
            "--query-gpu=name,driver_version,memory.total,memory.used",
            "--format=csv,noheader,nounits",
        ],
    );
    statuses.push(match gpu {
        Some(details) => status(
            "gpu",
            "NVIDIA GPU",
            "available",
            None,
            Some("cuda"),
            Some(details),
        ),
        None => status(
            "gpu",
            "NVIDIA GPU",
            "unavailable",
            None,
            Some("cuda"),
            Some("nvidia-smi did not return a usable GPU.".into()),
        ),
    });

    statuses.push(status(
        "musicgen",
        "MusicGen (AudioCraft)",
        if exists_from_root(r"02-Models\AudioCraft\source\.venv\Scripts\python.exe") {
            "installed"
        } else {
            "unavailable"
        },
        Some("1.4.0a2"),
        Some("cuda"),
        Some("Local AudioCraft runtime.".into()),
    ));
    statuses.push(status(
        "stable-audio",
        "Stable Audio 3 Small-Music",
        if exists_from_root(r"02-Models\Stable-Audio-3\source\.venv\Scripts\stable-audio.exe") {
            "installed"
        } else {
            "unavailable"
        },
        Some("small-music"),
        Some("cpu"),
        Some("Verified native Windows CPU route.".into()),
    ));
    statuses.push(status(
        "fish-speech",
        "Fish Speech 1.5",
        if exists_from_root(r"02-Models\Fish-Speech-1.5\source\.venv\Scripts\python.exe") {
            "installed"
        } else {
            "unavailable"
        },
        Some("1.5.0"),
        Some("cuda"),
        Some("Noncommercial CC BY-NC-SA 4.0.".into()),
    ));

    let ffmpeg_version = command_output("ffmpeg", &["-version"])
        .and_then(|value| value.lines().next().map(str::to_string));
    statuses.push(status(
        "ffmpeg",
        "FFmpeg",
        if ffmpeg_version.is_some() {
            "installed"
        } else {
            "unverified"
        },
        ffmpeg_version.as_deref(),
        None,
        Some(
            if ffmpeg_version.is_some() {
                "Available on PATH."
            } else {
                "Not available on the desktop process PATH."
            }
            .into(),
        ),
    ));

    for (id, label) in [
        ("uvr", "Ultimate Vocal Remover"),
        ("reaper", "REAPER"),
        ("comfyui", "ComfyUI Desktop"),
    ] {
        let found = find_external_app(id);
        statuses.push(status(
            id,
            label,
            if found.is_some() {
                "installed"
            } else {
                "unverified"
            },
            None,
            None,
            Some(
                found
                    .map(|path| path.to_string_lossy().into_owned())
                    .unwrap_or_else(|| "Application path was not detected.".into()),
            ),
        ));
    }

    let stable_checkpoint =
        workspace_root().join(r"02-Models\Stable-Audio-3\checkpoints\huggingface");
    statuses.push(status(
        "hf",
        "Hugging Face access",
        if stable_checkpoint.is_dir() {
            "available"
        } else {
            "unverified"
        },
        None,
        None,
        Some(
            if stable_checkpoint.is_dir() {
                "Stable Audio checkpoint cache is present."
            } else {
                "Checkpoint access has not been verified."
            }
            .into(),
        ),
    ));
    statuses.push(status(
        "storage",
        "Workspace storage",
        if workspace_root().is_dir() {
            "available"
        } else {
            "error"
        },
        None,
        None,
        Some(workspace_root().to_string_lossy().into_owned()),
    ));
    statuses
}

fn canonical_workspace_path(input: &str) -> Result<PathBuf, String> {
    let root = workspace_root()
        .canonicalize()
        .map_err(|error| format!("Workspace root is unavailable: {error}"))?;
    let candidate = Path::new(input);
    let resolved = if candidate.is_absolute() {
        candidate.to_path_buf()
    } else {
        root.join(candidate)
    };
    let canonical = resolved
        .canonicalize()
        .map_err(|error| format!("Path is unavailable: {error}"))?;
    if !canonical.starts_with(&root) {
        return Err("Only paths inside the Varynt Studio workspace may be revealed.".into());
    }
    Ok(canonical)
}

#[tauri::command]
fn reveal_path(path: String) -> Result<(), String> {
    let canonical = canonical_workspace_path(&path)?;
    let mut command = Command::new("explorer.exe");
    if canonical.is_file() {
        command.arg(format!("/select,{}", canonical.to_string_lossy()));
    } else {
        command.arg(&canonical);
    }
    command
        .spawn()
        .map_err(|error| format!("Could not open Explorer: {error}"))?;
    Ok(())
}

#[tauri::command]
fn launch_external_app(app: String) -> Result<(), String> {
    if app != "reaper" && app != "uvr" && app != "comfyui" {
        return Err("Unsupported external application.".into());
    }
    let label = match app.as_str() {
        "reaper" => "REAPER",
        "uvr" => "UVR",
        "comfyui" => "ComfyUI Desktop",
        _ => unreachable!(),
    };
    let path = find_external_app(&app).ok_or_else(|| {
        format!("{label} was not detected. Install it or configure its path in Settings.")
    })?;
    Command::new(path)
        .spawn()
        .map_err(|error| format!("Could not launch {app}: {error}"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_workspace_root,
            get_system_status,
            reveal_path,
            launch_external_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Varynt Studio");
}
