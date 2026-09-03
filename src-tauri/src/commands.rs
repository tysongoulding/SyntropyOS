use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State, Window};

use crate::paths::AppPaths;
use crate::protocol::{SystemStatus, WorkstreamCommand, WorkstreamEvent};
use crate::keystore::SecureKeystore;
use syntropy_core::blackboard::{BlackboardArtifact, BlackboardStore};
use syntropy_core::blueprints::sprint::OneHourSprintBlueprint;
use syntropy_engine::resilience::CircuitBreaker;
use syntropy_engine::routing::ModelRouter;
use tokio::sync::RwLock;

pub struct AppState {
    pub paths: AppPaths,
    pub keystore: SecureKeystore,
    pub blackboard: Arc<BlackboardStore>,
    pub router: ModelRouter,
    pub circuit_breaker: CircuitBreaker,
    pub total_hours_saved: Arc<RwLock<f64>>,
}

#[tauri::command]
pub async fn start_drag_window(window: Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn toggle_maximize_window(window: Window) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn open_local_path(app: AppHandle, path: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener().open_path(&path, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn open_external_url(app: AppHandle, url: String) -> Result<(), String> {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("Only HTTP and HTTPS URLs are permitted".to_string());
    }
    use tauri_plugin_opener::OpenerExt;
    app.opener().open_url(&url, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn sync_provider_keys(
    state: State<'_, AppState>,
    keys: HashMap<String, String>,
) -> Result<(), String> {
    for (provider, key) in keys {
        let _ = state.keystore.set_secret(&provider, &key).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn save_lota_settings(_settings: serde_json::Value) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn send_rpc_command(
    app: AppHandle,
    state: State<'_, AppState>,
    request: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let req_id = request.get("id").and_then(|v| v.as_str()).unwrap_or("req-0").to_string();
    let cmd_type = request.get("type").and_then(|v| v.as_str()).unwrap_or("unknown");

    if cmd_type == "prompt" {
        let message = request.get("message").and_then(|v| v.as_str()).unwrap_or("");
        let ws_id = format!("ws-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>());

        // Stream typewriter events
        let stream_text = format!("SyntropyOS Autonomous Federation processing: \"{}\". Synthesizing Blackboard artifacts.", message);
        for chunk in stream_text.split_whitespace() {
            let _ = app.emit(
                "rho://event",
                serde_json::json!({
                    "type": "event",
                    "event": "token_stream",
                    "chunk": format!("{} ", chunk)
                }),
            );
        }

        // Increment FTA hours
        {
            let mut lock = state.total_hours_saved.write().await;
            *lock += 0.5;
        }

        return Ok(serde_json::json!({
            "id": req_id,
            "type": "response",
            "command": "prompt",
            "success": true,
            "data": { "workstream_id": ws_id },
            "error": null
        }));
    }

    Ok(serde_json::json!({
        "id": req_id,
        "type": "response",
        "command": cmd_type,
        "success": true,
        "data": null,
        "error": null
    }))
}

#[tauri::command]
pub async fn execute_command(
    app: AppHandle,
    state: State<'_, AppState>,
    cmd: WorkstreamCommand,
) -> Result<serde_json::Value, String> {
    match cmd {
        WorkstreamCommand::LaunchWorkstream {
            blueprint_id,
            workstream_name,
            params: _,
        } => {
            let ws_id = format!("ws-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>());

            let _ = app.emit(
                "workstream://event",
                WorkstreamEvent::SmeTaskStarted {
                    task_id: format!("{}-task-1", ws_id),
                    agent_id: "sme_research".to_string(),
                    role: "Research Specialist".to_string(),
                    phase: "Understand & Map".to_string(),
                },
            );

            if blueprint_id.contains("sprint") || blueprint_id == "1hour" {
                let _sprint = OneHourSprintBlueprint::new(&ws_id, &workstream_name);
                let artifact_uri = format!("blackboard://{}/team-research/sme_research/user_journey@v1", ws_id);
                if let Ok(art) = BlackboardArtifact::new(
                    &artifact_uri,
                    "sme_research",
                    "User Journey & Domain Brief",
                    &format!("# User Journey for {}\nDomain entities and touchpoints analyzed.", workstream_name),
                    "text/markdown",
                ) {
                    let _ = state.blackboard.publish("sme_research", art).await;
                    let _ = app.emit(
                        "workstream://event",
                        WorkstreamEvent::ArtifactPublished {
                            uri: artifact_uri,
                            title: "User Journey & Domain Brief".to_string(),
                            author: "sme_research".to_string(),
                            version: 1,
                            size_bytes: 85,
                        },
                    );
                }

                let stream_text = "Analyzing requirement brief... Identified 3 core persona workflows.";
                for chunk in stream_text.split_whitespace() {
                    let _ = app.emit(
                        "workstream://event",
                        WorkstreamEvent::TokenStream {
                            task_id: format!("{}-task-1", ws_id),
                            agent_id: "sme_research".to_string(),
                            chunk: format!("{} ", chunk),
                        },
                    );
                }

                {
                    let mut lock = state.total_hours_saved.write().await;
                    *lock += 2.5;
                }
            }

            Ok(serde_json::json!({
                "status": "launched",
                "workstream_id": ws_id,
                "name": workstream_name
            }))
        }

        WorkstreamCommand::PauseWorkstream { workstream_id } => {
            Ok(serde_json::json!({
                "status": "paused",
                "workstream_id": workstream_id
            }))
        }

        WorkstreamCommand::ApproveMilestone {
            workstream_id,
            milestone_id,
        } => {
            Ok(serde_json::json!({
                "status": "approved",
                "workstream_id": workstream_id,
                "milestone_id": milestone_id
            }))
        }

        WorkstreamCommand::ReadBlackboard { uri } => {
            let art = state
                .blackboard
                .get(&uri)
                .await
                .map_err(|e| e.to_string())?;
            Ok(serde_json::to_value(&art).map_err(|e| e.to_string())?)
        }

        WorkstreamCommand::SaveApiKey { provider, key } => {
            state
                .keystore
                .set_secret(&provider, &key)
                .await
                .map_err(|e| e.to_string())?;
            Ok(serde_json::json!({ "status": "saved", "provider": provider }))
        }

        WorkstreamCommand::GetSystemStatus => {
            let total_hours = *state.total_hours_saved.read().await;
            let status = SystemStatus {
                version: "0.6.0".to_string(),
                os: std::env::consts::OS.to_string(),
                app_data_dir: state.paths.app_data_dir.to_string_lossy().to_string(),
                extensions_dir: state.paths.extensions_dir.to_string_lossy().to_string(),
                connected_providers: vec!["gemini".to_string(), "anthropic".to_string()],
                active_workstreams_count: 1,
                total_labor_hours_saved: total_hours,
            };
            Ok(serde_json::to_value(&status).map_err(|e| e.to_string())?)
        }

        WorkstreamCommand::CalibrateFta {
            workstream_id,
            rating,
            hours_saved,
        } => {
            let mut lock = state.total_hours_saved.write().await;
            *lock += hours_saved;
            Ok(serde_json::json!({
                "status": "calibrated",
                "workstream_id": workstream_id,
                "rating": rating,
                "cumulative_hours_saved": *lock
            }))
        }
    }
}
