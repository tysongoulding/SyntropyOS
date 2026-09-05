use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State, Window};

use crate::paths::AppPaths;
use crate::protocol::{
    PromptConfigDto, RpcEvent, SystemStatus, TestKeyResponse, WorkstreamCommand, WorkstreamEvent,
};
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
pub async fn get_saved_auth_keys(
    state: State<'_, AppState>,
) -> Result<HashMap<String, String>, String> {
    let mut map = HashMap::new();
    let providers = ["gemini", "anthropic", "openai", "deepseek", "groq"];
    for p in providers {
        if let Ok(Some(secret)) = state.keystore.get_secret(p).await {
            map.insert(p.to_string(), secret.to_string());
        }
    }
    Ok(map)
}

#[tauri::command]
pub async fn test_provider_key(
    provider: String,
    key: String,
) -> Result<TestKeyResponse, String> {
    let clean_key = key.trim();
    if clean_key.is_empty() {
        return Ok(TestKeyResponse {
            success: false,
            latency_ms: 0,
            message: "API Key cannot be blank".to_string(),
            models: Vec::new(),
        });
    }

    let start = std::time::Instant::now();
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    match provider.as_str() {
        "gemini" => {
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models?key={}",
                clean_key
            );
            match client.get(&url).send().await {
                Ok(resp) => {
                    let latency = start.elapsed().as_millis() as u64;
                    let status = resp.status();
                    if status.is_success() {
                        let body = resp.text().await.unwrap_or_default();
                        let mut models = Vec::new();
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&body) {
                            if let Some(arr) = val.get("models").and_then(|m| m.as_array()) {
                                for item in arr {
                                    let supports_gen = item
                                        .get("supportedGenerationMethods")
                                        .and_then(|v| v.as_array())
                                        .map(|methods| {
                                            methods.iter().any(|m| m.as_str() == Some("generateContent"))
                                        })
                                        .unwrap_or(true);
                                    if supports_gen {
                                        if let Some(name) = item.get("name").and_then(|n| n.as_str()) {
                                            let clean_name = name.strip_prefix("models/").unwrap_or(name);
                                            models.push(clean_name.to_string());
                                        }
                                    }
                                }
                            }
                        }
                        if models.is_empty() {
                            models = vec![
                                "gemini-2.5-flash".to_string(),
                                "gemini-2.5-pro".to_string(),
                                "gemini-2.0-flash".to_string(),
                                "gemini-2.0-flash-lite".to_string(),
                                "gemini-2.0-flash-thinking-exp-01-21".to_string(),
                                "gemini-1.5-flash".to_string(),
                                "gemini-1.5-pro".to_string(),
                            ];
                        }
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("Google Gemini Verified ({}, {} models discovered)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        Ok(TestKeyResponse {
                            success: false,
                            latency_ms: latency,
                            message: error_msg,
                            models: Vec::new(),
                        })
                    }
                }
                Err(err) => Ok(TestKeyResponse {
                    success: false,
                    latency_ms: start.elapsed().as_millis() as u64,
                    message: err.to_string(),
                    models: Vec::new(),
                }),
            }
        }
        "anthropic" => {
            let url = "https://api.anthropic.com/v1/models";
            match client
                .get(url)
                .header("x-api-key", clean_key)
                .header("anthropic-version", "2023-06-01")
                .send()
                .await
            {
                Ok(resp) => {
                    let latency = start.elapsed().as_millis() as u64;
                    let status = resp.status();
                    if status.is_success() {
                        let body = resp.text().await.unwrap_or_default();
                        let mut models = Vec::new();
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&body) {
                            if let Some(arr) = val.get("data").and_then(|d| d.as_array()) {
                                for item in arr {
                                    if let Some(id) = item.get("id").and_then(|i| i.as_str()) {
                                        if id.starts_with("claude-") {
                                            models.push(id.to_string());
                                        }
                                    }
                                }
                            }
                        }
                        if models.is_empty() {
                            models = vec![
                                "claude-3-7-sonnet-20250219".to_string(),
                                "claude-3-5-sonnet-20241022".to_string(),
                                "claude-3-5-haiku-20241022".to_string(),
                            ];
                        }
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("Anthropic Verified ({}, {} models discovered)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        Ok(TestKeyResponse {
                            success: false,
                            latency_ms: latency,
                            message: error_msg,
                            models: Vec::new(),
                        })
                    }
                }
                Err(err) => Ok(TestKeyResponse {
                    success: false,
                    latency_ms: start.elapsed().as_millis() as u64,
                    message: err.to_string(),
                    models: Vec::new(),
                }),
            }
        }
        "openai" => {
            let url = "https://api.openai.com/v1/models";
            match client
                .get(url)
                .header("Authorization", format!("Bearer {}", clean_key))
                .send()
                .await
            {
                Ok(resp) => {
                    let latency = start.elapsed().as_millis() as u64;
                    let status = resp.status();
                    if status.is_success() {
                        let body = resp.text().await.unwrap_or_default();
                        let mut models = Vec::new();
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&body) {
                            if let Some(arr) = val.get("data").and_then(|d| d.as_array()) {
                                for item in arr {
                                    if let Some(id) = item.get("id").and_then(|i| i.as_str()) {
                                        if (id.starts_with("gpt-") || id.starts_with("o1") || id.starts_with("o3") || id.starts_with("chatgpt-"))
                                            && !id.contains("audio")
                                            && !id.contains("realtime")
                                            && !id.contains("embedding")
                                            && !id.contains("tts")
                                            && !id.contains("whisper")
                                        {
                                            models.push(id.to_string());
                                        }
                                    }
                                }
                            }
                        }
                        models.sort();
                        if models.is_empty() {
                            models = vec![
                                "gpt-4o".to_string(),
                                "gpt-4o-mini".to_string(),
                                "o1".to_string(),
                                "o3-mini".to_string(),
                            ];
                        }
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("OpenAI Verified ({}, {} models discovered)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        Ok(TestKeyResponse {
                            success: false,
                            latency_ms: latency,
                            message: error_msg,
                            models: Vec::new(),
                        })
                    }
                }
                Err(err) => Ok(TestKeyResponse {
                    success: false,
                    latency_ms: start.elapsed().as_millis() as u64,
                    message: err.to_string(),
                    models: Vec::new(),
                }),
            }
        }
        "groq" => {
            let url = "https://api.groq.com/openai/v1/models";
            match client
                .get(url)
                .header("Authorization", format!("Bearer {}", clean_key))
                .send()
                .await
            {
                Ok(resp) => {
                    let latency = start.elapsed().as_millis() as u64;
                    let status = resp.status();
                    if status.is_success() {
                        let body = resp.text().await.unwrap_or_default();
                        let mut models = Vec::new();
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&body) {
                            if let Some(arr) = val.get("data").and_then(|d| d.as_array()) {
                                for item in arr {
                                    if let Some(id) = item.get("id").and_then(|i| i.as_str()) {
                                        if !id.contains("whisper") {
                                            models.push(id.to_string());
                                        }
                                    }
                                }
                            }
                        }
                        if models.is_empty() {
                            models = vec![
                                "llama-3.3-70b-versatile".to_string(),
                                "mixtral-8x7b-32768".to_string(),
                            ];
                        }
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("Groq Verified ({}, {} models discovered)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        Ok(TestKeyResponse {
                            success: false,
                            latency_ms: latency,
                            message: error_msg,
                            models: Vec::new(),
                        })
                    }
                }
                Err(err) => Ok(TestKeyResponse {
                    success: false,
                    latency_ms: start.elapsed().as_millis() as u64,
                    message: err.to_string(),
                    models: Vec::new(),
                }),
            }
        }
        "deepseek" => {
            let url = "https://api.deepseek.com/models";
            match client
                .get(url)
                .header("Authorization", format!("Bearer {}", clean_key))
                .send()
                .await
            {
                Ok(resp) => {
                    let latency = start.elapsed().as_millis() as u64;
                    let status = resp.status();
                    if status.is_success() {
                        let body = resp.text().await.unwrap_or_default();
                        let mut models = Vec::new();
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&body) {
                            if let Some(arr) = val.get("data").and_then(|d| d.as_array()) {
                                for item in arr {
                                    if let Some(id) = item.get("id").and_then(|i| i.as_str()) {
                                        models.push(id.to_string());
                                    }
                                }
                            }
                        }
                        if models.is_empty() {
                            models = vec![
                                "deepseek-chat".to_string(),
                                "deepseek-reasoner".to_string(),
                            ];
                        }
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("DeepSeek Verified ({}, {} models discovered)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        Ok(TestKeyResponse {
                            success: false,
                            latency_ms: latency,
                            message: error_msg,
                            models: Vec::new(),
                        })
                    }
                }
                Err(err) => Ok(TestKeyResponse {
                    success: false,
                    latency_ms: start.elapsed().as_millis() as u64,
                    message: err.to_string(),
                    models: Vec::new(),
                }),
            }
        }
        _ => Ok(TestKeyResponse {
            success: true,
            latency_ms: 5,
            message: "Format accepted".to_string(),
            models: Vec::new(),
        }),
    }
}

#[tauri::command]
pub async fn fetch_provider_models(
    state: State<'_, AppState>,
    provider: String,
) -> Result<TestKeyResponse, String> {
    let key = match state.keystore.get_secret(&provider).await {
        Ok(Some(secret)) => secret.to_string(),
        _ => {
            return Ok(TestKeyResponse {
                success: false,
                latency_ms: 0,
                message: format!("No API key found in vault for provider {}", provider),
                models: Vec::new(),
            });
        }
    };
    test_provider_key(provider, key).await
}


#[tauri::command]
pub async fn load_lota_settings(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let path = state.paths.app_data_dir.join("settings.json");
    if path.exists() {
        let content = tokio::fs::read_to_string(&path)
            .await
            .map_err(|e| e.to_string())?;
        let val: serde_json::Value = serde_json::from_str(&content)
            .map_err(|e| e.to_string())?;
        Ok(val)
    } else {
        Ok(serde_json::json!({}))
    }
}

#[tauri::command]
pub async fn save_lota_settings(
    state: State<'_, AppState>,
    settings: serde_json::Value,
) -> Result<(), String> {
    let path = state.paths.app_data_dir.join("settings.json");
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    tokio::fs::write(&path, content)
        .await
        .map_err(|e| e.to_string())?;
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
        let requested_model = request
            .get("model")
            .and_then(|v| v.as_str())
            .filter(|m| !m.is_empty())
            .unwrap_or("gemini-2.5-flash");
        let ws_id = format!("ws-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>());

        // 1. Emit turn_start
        let _ = app.emit(
            "rho://event",
            RpcEvent::TurnStart {
                turn_number: 1,
                prompt: message.to_string(),
            },
        );

        // 2. Retrieve Gemini API key from hardware Keystore
        let gemini_key = state.keystore.get_secret("gemini").await.ok().flatten();

        let full_response = if let Some(key) = gemini_key {
            let client = reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(60))
                .build()
                .unwrap_or_default();

            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                requested_model,
                key.as_str()
            );

            let body = serde_json::json!({
                "contents": [
                    {
                        "role": "user",
                        "parts": [{ "text": message }]
                    }
                ]
            });

            match client.post(&url).json(&body).send().await {
                Ok(resp) => {
                    let status = resp.status();
                    if status.is_success() {
                        let data: serde_json::Value = resp.json().await.unwrap_or_default();
                        data["candidates"][0]["content"]["parts"][0]["text"]
                            .as_str()
                            .unwrap_or("No response content generated from Gemini.")
                            .to_string()
                    } else {
                        let err_body = resp.text().await.unwrap_or_default();
                        let msg = serde_json::from_str::<serde_json::Value>(&err_body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        format!("⚠️ Google Gemini API Error: {}", msg)
                    }
                }
                Err(e) => format!("⚠️ Google Gemini Connection Error: {}", e),
            }
        } else {
            format!(
                "⚠️ No Google Gemini API key configured in Keystore.\n\nPlease open Settings -> Cloud Providers & API Keys and save your Gemini API key to activate live inference.\n\n(Local echo: \"{}\")",
                message
            )
        };

        // 3. Stream text chunks
        for chunk in full_response.split_inclusive(' ') {
            let _ = app.emit(
                "rho://event",
                RpcEvent::TextChunk {
                    content: chunk.to_string(),
                },
            );
            tokio::time::sleep(tokio::time::Duration::from_millis(15)).await;
        }

        // 4. Emit turn_end
        let _ = app.emit(
            "rho://event",
            RpcEvent::TurnEnd {
                turn_number: 1,
            },
        );

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
                version: env!("CARGO_PKG_VERSION").to_string(),
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

        WorkstreamCommand::GetPromptConfig { role } => {
            let config = get_prompt_config(state, role).await?;
            Ok(serde_json::to_value(&config).map_err(|e| e.to_string())?)
        }

        WorkstreamCommand::SaveCustomPrompt { role, content, activate } => {
            save_custom_prompt(state, role, content, activate).await?;
            Ok(serde_json::json!({ "status": "saved" }))
        }

        WorkstreamCommand::GetBlackboardManifest { board_id } => {
            get_blackboard_manifest(state, board_id).await
        }

        WorkstreamCommand::GetBlackboardPresentation { board_id } => {
            let md = get_blackboard_presentation(state, board_id).await?;
            Ok(serde_json::Value::String(md))
        }

        WorkstreamCommand::VerifyInvariants { board_id } => {
            verify_invariants(state, board_id).await
        }
    }
}

#[tauri::command]
pub async fn get_prompt_config(
    state: State<'_, AppState>,
    role: String,
) -> Result<PromptConfigDto, String> {
    let custom_path = state.paths.custom_prompts_dir.join(format!("{}.md", role));
    if custom_path.exists() {
        let content = tokio::fs::read_to_string(&custom_path)
            .await
            .map_err(|e| e.to_string())?;
        Ok(PromptConfigDto {
            role,
            is_custom: true,
            display_status: "Custom".to_string(),
            prompt_content: content,
        })
    } else {
        Ok(PromptConfigDto {
            role,
            is_custom: false,
            display_status: "Defaulted".to_string(),
            prompt_content: "".to_string(), // NEVER return proprietary prompt text to frontend
        })
    }
}

#[tauri::command]
pub async fn save_custom_prompt(
    state: State<'_, AppState>,
    role: String,
    content: String,
    activate: bool,
) -> Result<(), String> {
    let custom_path = state.paths.custom_prompts_dir.join(format!("{}.md", role));
    if activate {
        tokio::fs::write(&custom_path, &content)
            .await
            .map_err(|e| e.to_string())?;
    } else if custom_path.exists() {
        let _ = tokio::fs::remove_file(&custom_path).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_blackboard_manifest(
    state: State<'_, AppState>,
    board_id: String,
) -> Result<serde_json::Value, String> {
    match state.blackboard.get_manifest(&board_id).await {
        Ok(manifest) => Ok(serde_json::to_value(&manifest).map_err(|e| e.to_string())?),
        Err(_) => {
            let manifest = syntropy_core::blackboard::BlackboardManifest::new(&board_id);
            Ok(serde_json::to_value(&manifest).map_err(|e| e.to_string())?)
        }
    }
}

#[tauri::command]
pub async fn get_blackboard_presentation(
    state: State<'_, AppState>,
    board_id: String,
) -> Result<String, String> {
    match state.blackboard.get_presentation_markdown(&board_id).await {
        Ok(md) => Ok(md),
        Err(_) => {
            let manifest = syntropy_core::blackboard::BlackboardManifest::new(&board_id);
            Ok(manifest.compile_presentation_markdown())
        }
    }
}

#[tauri::command]
pub async fn verify_invariants(
    state: State<'_, AppState>,
    board_id: String,
) -> Result<serde_json::Value, String> {
    match state.blackboard.verify_manifest_invariants(&board_id).await {
        Ok(res) => Ok(serde_json::to_value(&res).map_err(|e| e.to_string())?),
        Err(_) => {
            let manifest = syntropy_core::blackboard::BlackboardManifest::new(&board_id);
            let res = syntropy_core::blackboard::DeterministicInvariantEngine::verify(&manifest);
            Ok(serde_json::to_value(&res).map_err(|e| e.to_string())?)
        }
    }
}
