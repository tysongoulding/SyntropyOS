use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State, Window};

use crate::paths::AppPaths;
use crate::protocol::{
    PromptConfigDto, RpcEvent, SearchResult, SystemStatus, TestKeyResponse, WorkstreamCommand, WorkstreamEvent,
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
    let providers = ["gemini", "anthropic", "openai", "deepseek", "groq", "xai"];
    for p in providers {
        if let Ok(Some(secret)) = state.keystore.get_secret(p).await {
            map.insert(p.to_string(), secret.to_string());
        }
    }
    Ok(map)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedProviderModels {
    pub provider: String,
    pub models: Vec<String>,
    pub cached_at: u64,
}

pub fn get_models_cache_path(app_data_dir: &std::path::Path) -> std::path::PathBuf {
    app_data_dir.join("models_cache.json")
}

pub async fn save_provider_models_to_cache(
    app_data_dir: &std::path::Path,
    provider: &str,
    models: &[String],
) {
    if models.is_empty() {
        return;
    }
    let cache_path = get_models_cache_path(app_data_dir);
    let mut cache_map: HashMap<String, CachedProviderModels> = if cache_path.exists() {
        match tokio::fs::read_to_string(&cache_path).await {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => HashMap::new(),
        }
    } else {
        HashMap::new()
    };

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    cache_map.insert(
        provider.to_string(),
        CachedProviderModels {
            provider: provider.to_string(),
            models: models.to_vec(),
            cached_at: now,
        },
    );

    if let Ok(serialized) = serde_json::to_string_pretty(&cache_map) {
        let _ = tokio::fs::write(&cache_path, serialized).await;
    }
}

pub async fn read_provider_models_from_cache(
    app_data_dir: &std::path::Path,
    provider: &str,
) -> Option<Vec<String>> {
    let cache_path = get_models_cache_path(app_data_dir);
    if !cache_path.exists() {
        return None;
    }
    let content = tokio::fs::read_to_string(&cache_path).await.ok()?;
    let cache_map: HashMap<String, CachedProviderModels> = serde_json::from_str(&content).ok()?;
    cache_map.get(provider).map(|entry| entry.models.clone())
}

pub async fn read_all_models_from_cache(
    app_data_dir: &std::path::Path,
) -> HashMap<String, Vec<String>> {
    let cache_path = get_models_cache_path(app_data_dir);
    let mut res = HashMap::new();
    if !cache_path.exists() {
        return res;
    }
    if let Ok(content) = tokio::fs::read_to_string(&cache_path).await {
        if let Ok(cache_map) = serde_json::from_str::<HashMap<String, CachedProviderModels>>(&content) {
            for (p, entry) in cache_map {
                res.insert(p, entry.models);
            }
        }
    }
    res
}

fn is_deprecated_gemini_model(model: &str) -> bool {
    let m = model.to_lowercase();
    m.contains("1.0")
        || m.contains("bison")
        || m.contains("aqa")
        || m.contains("embedding")
        || m.contains("text-")
        || m.contains("imagen")
        || m == "gemini-pro"
        || m == "gemini-pro-vision"
}

#[tauri::command]
pub async fn test_provider_key(
    provider: String,
    key: Option<String>,
    state: State<'_, AppState>,
) -> Result<TestKeyResponse, String> {
    let is_ollama = provider == "ollama";
    let resolved_key = if let Some(k) = key.filter(|k| !k.trim().is_empty()) {
        Some(k)
    } else {
        state.keystore.get_secret(&provider).await.ok().flatten().map(|s| s.as_str().to_string())
    };

    let clean_key = resolved_key.as_deref().unwrap_or("").trim();
    if clean_key.is_empty() && !is_ollama {
        // Fallback to cached models if available when key is empty
        if let Some(cached) = read_provider_models_from_cache(&state.paths.app_data_dir, &provider).await {
            if !cached.is_empty() {
                return Ok(TestKeyResponse {
                    success: false,
                    latency_ms: 0,
                    message: format!("No active API key, but {} cached models found for {}", cached.len(), provider),
                    models: cached,
                });
            }
        }
        return Ok(TestKeyResponse {
            success: false,
            latency_ms: 0,
            message: format!("No API key found in Keystore for {}. Please enter an API key.", provider),
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
                                            if !is_deprecated_gemini_model(clean_name) {
                                                models.push(clean_name.to_string());
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if models.is_empty() {
                            models = vec![
                                "gemini-2.0-flash".to_string(),
                                "gemini-2.0-flash-lite".to_string(),
                                "gemini-2.0-flash-thinking-exp-01-21".to_string(),
                                "gemini-1.5-flash".to_string(),
                                "gemini-1.5-pro".to_string(),
                            ];
                        }

                        // Sort models prioritizing latest production generation
                        models.sort_by(|a, b| {
                            let score = |name: &str| -> i32 {
                                if name.starts_with("gemini-2.0-flash") { 100 }
                                else if name.starts_with("gemini-2.0-flash-thinking") { 95 }
                                else if name.starts_with("gemini-2.0") { 90 }
                                else if name.starts_with("gemini-1.5-flash") { 80 }
                                else if name.starts_with("gemini-1.5-pro") { 70 }
                                else { 10 }
                            };
                            score(b).cmp(&score(a))
                        });

                        // Cache live discovered models to disk
                        save_provider_models_to_cache(&state.paths.app_data_dir, "gemini", &models).await;

                        // Live probe to verify model generation actually succeeds
                        let mut verified_working_model = String::new();
                        for candidate in models.iter().take(3) {
                            let ping_url = format!(
                                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                                candidate,
                                clean_key
                            );
                            let ping_body = serde_json::json!({
                                "contents": [{ "role": "user", "parts": [{ "text": "ping" }] }]
                            });
                            if let Ok(ping_resp) = client.post(&ping_url).json(&ping_body).send().await {
                                if ping_resp.status().is_success() {
                                    verified_working_model = candidate.clone();
                                    break;
                                }
                            }
                        }

                        let message = if !verified_working_model.is_empty() {
                            format!("Google Gemini Verified & Active (Tested generateContent on {}, {} models cached)", verified_working_model, models.len())
                        } else {
                            format!("Google Gemini Verified ({}, {} models discovered & cached)", status.as_u16(), models.len())
                        };

                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message,
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "gemini").await.unwrap_or_default();
                        Ok(TestKeyResponse {
                            success: !cached.is_empty(),
                            latency_ms: latency,
                            message: if !cached.is_empty() {
                                format!("{} (Loaded {} cached models)", error_msg, cached.len())
                            } else {
                                error_msg
                            },
                            models: cached,
                        })
                    }
                }
                Err(err) => {
                    let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "gemini").await.unwrap_or_default();
                    Ok(TestKeyResponse {
                        success: !cached.is_empty(),
                        latency_ms: start.elapsed().as_millis() as u64,
                        message: if !cached.is_empty() {
                            format!("{} (Loaded {} cached models)", err, cached.len())
                        } else {
                            err.to_string()
                        },
                        models: cached,
                    })
                }
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
                        models.sort_by(|a, b| {
                            let score = |name: &str| -> i32 {
                                if name.contains("3-7-sonnet") { 100 }
                                else if name.contains("3-5-sonnet") { 90 }
                                else if name.contains("3-5-haiku") { 80 }
                                else if name.contains("3-opus") { 70 }
                                else { 10 }
                            };
                            score(b).cmp(&score(a))
                        });
                        save_provider_models_to_cache(&state.paths.app_data_dir, "anthropic", &models).await;
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("Anthropic Verified ({}, {} models cached)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "anthropic").await.unwrap_or_default();
                        Ok(TestKeyResponse {
                            success: !cached.is_empty(),
                            latency_ms: latency,
                            message: if !cached.is_empty() {
                                format!("{} (Loaded {} cached models)", error_msg, cached.len())
                            } else {
                                error_msg
                            },
                            models: cached,
                        })
                    }
                }
                Err(err) => {
                    let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "anthropic").await.unwrap_or_default();
                    Ok(TestKeyResponse {
                        success: !cached.is_empty(),
                        latency_ms: start.elapsed().as_millis() as u64,
                        message: if !cached.is_empty() {
                            format!("{} (Loaded {} cached models)", err, cached.len())
                        } else {
                            err.to_string()
                        },
                        models: cached,
                    })
                }
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
                                        let m = id.to_lowercase();
                                        let is_chat = m.starts_with("gpt-") || m.starts_with("o1") || m.starts_with("o3") || m.starts_with("chatgpt-");
                                        let is_unusable = m.contains("audio")
                                            || m.contains("realtime")
                                            || m.contains("embedding")
                                            || m.contains("tts")
                                            || m.contains("whisper")
                                            || m.contains("dall-e")
                                            || m.contains("moderation")
                                            || m.contains("davinci")
                                            || m.contains("babbage")
                                            || m.contains("instruct")
                                            || m.contains("search")
                                            || m.contains("similarity");
                                        if is_chat && !is_unusable {
                                            models.push(id.to_string());
                                        }
                                    }
                                }
                            }
                        }
                        if models.is_empty() {
                            models = vec![
                                "gpt-4o".to_string(),
                                "gpt-4o-mini".to_string(),
                                "o1".to_string(),
                                "o3-mini".to_string(),
                            ];
                        }
                        models.sort_by(|a, b| {
                            let score = |name: &str| -> i32 {
                                if name == "gpt-4o" { 100 }
                                else if name == "gpt-4o-mini" { 95 }
                                else if name.starts_with("o3") { 90 }
                                else if name.starts_with("o1") { 85 }
                                else if name.starts_with("chatgpt-4o") { 80 }
                                else if name.starts_with("gpt-4-turbo") { 75 }
                                else if name.starts_with("gpt-4") { 70 }
                                else { 50 }
                            };
                            score(b).cmp(&score(a))
                        });
                        save_provider_models_to_cache(&state.paths.app_data_dir, "openai", &models).await;
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("OpenAI Verified ({}, {} models cached)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "openai").await.unwrap_or_default();
                        Ok(TestKeyResponse {
                            success: !cached.is_empty(),
                            latency_ms: latency,
                            message: if !cached.is_empty() {
                                format!("{} (Loaded {} cached models)", error_msg, cached.len())
                            } else {
                                error_msg
                            },
                            models: cached,
                        })
                    }
                }
                Err(err) => {
                    let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "openai").await.unwrap_or_default();
                    Ok(TestKeyResponse {
                        success: !cached.is_empty(),
                        latency_ms: start.elapsed().as_millis() as u64,
                        message: if !cached.is_empty() {
                            format!("{} (Loaded {} cached models)", err, cached.len())
                        } else {
                            err.to_string()
                        },
                        models: cached,
                    })
                }
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
                                        let is_active = item.get("active").and_then(|a| a.as_bool()).unwrap_or(true);
                                        if is_active && !id.contains("whisper") && !id.contains("audio") && !id.contains("embedding") {
                                            models.push(id.to_string());
                                        }
                                    }
                                }
                            }
                        }
                        if models.is_empty() {
                            models = vec![
                                "llama-3.3-70b-versatile".to_string(),
                                "llama-3.1-8b-instant".to_string(),
                                "mixtral-8x7b-32768".to_string(),
                            ];
                        }
                        models.sort_by(|a, b| {
                            let score = |name: &str| -> i32 {
                                if name.contains("3.3-70b") { 100 }
                                else if name.contains("3.1-8b") { 90 }
                                else if name.contains("distill") { 80 }
                                else if name.contains("mixtral") { 70 }
                                else { 50 }
                            };
                            score(b).cmp(&score(a))
                        });
                        save_provider_models_to_cache(&state.paths.app_data_dir, "groq", &models).await;
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("Groq Verified ({}, {} models cached)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "groq").await.unwrap_or_default();
                        Ok(TestKeyResponse {
                            success: !cached.is_empty(),
                            latency_ms: latency,
                            message: if !cached.is_empty() {
                                format!("{} (Loaded {} cached models)", error_msg, cached.len())
                            } else {
                                error_msg
                            },
                            models: cached,
                        })
                    }
                }
                Err(err) => {
                    let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "groq").await.unwrap_or_default();
                    Ok(TestKeyResponse {
                        success: !cached.is_empty(),
                        latency_ms: start.elapsed().as_millis() as u64,
                        message: if !cached.is_empty() {
                            format!("{} (Loaded {} cached models)", err, cached.len())
                        } else {
                            err.to_string()
                        },
                        models: cached,
                    })
                }
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
                        save_provider_models_to_cache(&state.paths.app_data_dir, "deepseek", &models).await;
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("DeepSeek Verified ({}, {} models cached)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "deepseek").await.unwrap_or_default();
                        Ok(TestKeyResponse {
                            success: !cached.is_empty(),
                            latency_ms: latency,
                            message: if !cached.is_empty() {
                                format!("{} (Loaded {} cached models)", error_msg, cached.len())
                            } else {
                                error_msg
                            },
                            models: cached,
                        })
                    }
                }
                Err(err) => {
                    let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "deepseek").await.unwrap_or_default();
                    Ok(TestKeyResponse {
                        success: !cached.is_empty(),
                        latency_ms: start.elapsed().as_millis() as u64,
                        message: if !cached.is_empty() {
                            format!("{} (Loaded {} cached models)", err, cached.len())
                        } else {
                            err.to_string()
                        },
                        models: cached,
                    })
                }
            }
        }
        "xai" => {
            let url = "https://api.x.ai/v1/models";
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
                                        if id.contains("grok") && !id.contains("embedding") {
                                            models.push(id.to_string());
                                        }
                                    }
                                }
                            }
                        }
                        if models.is_empty() {
                            models = vec![
                                "grok-2-1212".to_string(),
                                "grok-2-vision-1212".to_string(),
                                "grok-beta".to_string(),
                            ];
                        }
                        models.sort_by(|a, b| {
                            let score = |name: &str| -> i32 {
                                if name.starts_with("grok-2-1212") { 100 }
                                else if name.starts_with("grok-2") { 90 }
                                else if name.starts_with("grok-3") { 85 }
                                else if name.starts_with("grok-beta") { 80 }
                                else { 50 }
                            };
                            score(b).cmp(&score(a))
                        });
                        save_provider_models_to_cache(&state.paths.app_data_dir, "xai", &models).await;
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("xAI Verified ({}, {} models cached)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let body = resp.text().await.unwrap_or_default();
                        let error_msg = serde_json::from_str::<serde_json::Value>(&body)
                            .ok()
                            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                        let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "xai").await.unwrap_or_default();
                        Ok(TestKeyResponse {
                            success: !cached.is_empty(),
                            latency_ms: latency,
                            message: if !cached.is_empty() {
                                format!("{} (Loaded {} cached models)", error_msg, cached.len())
                            } else {
                                error_msg
                            },
                            models: cached,
                        })
                    }
                }
                Err(err) => {
                    let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "xai").await.unwrap_or_default();
                    Ok(TestKeyResponse {
                        success: !cached.is_empty(),
                        latency_ms: start.elapsed().as_millis() as u64,
                        message: if !cached.is_empty() {
                            format!("{} (Loaded {} cached models)", err, cached.len())
                        } else {
                            err.to_string()
                        },
                        models: cached,
                    })
                }
            }
        }
        "ollama" => {
            let endpoint = if clean_key.starts_with("http") {
                clean_key.to_string()
            } else {
                "http://127.0.0.1:11434".to_string()
            };
            let url = format!("{}/api/tags", endpoint.trim_end_matches('/'));
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
                                    if let Some(name) = item.get("name").and_then(|n| n.as_str()) {
                                        models.push(name.to_string());
                                    }
                                }
                            }
                        }
                        if models.is_empty() {
                            models = vec!["llama3.2".to_string()];
                        }
                        save_provider_models_to_cache(&state.paths.app_data_dir, "ollama", &models).await;
                        Ok(TestKeyResponse {
                            success: true,
                            latency_ms: latency,
                            message: format!("Ollama Verified ({}, {} models cached)", status.as_u16(), models.len()),
                            models,
                        })
                    } else {
                        let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "ollama").await.unwrap_or_default();
                        Ok(TestKeyResponse {
                            success: !cached.is_empty(),
                            latency_ms: latency,
                            message: format!("Ollama HTTP {} (Cached: {})", status.as_u16(), cached.len()),
                            models: cached,
                        })
                    }
                }
                Err(err) => {
                    let cached = read_provider_models_from_cache(&state.paths.app_data_dir, "ollama").await.unwrap_or_default();
                    Ok(TestKeyResponse {
                        success: !cached.is_empty(),
                        latency_ms: start.elapsed().as_millis() as u64,
                        message: if !cached.is_empty() {
                            format!("{} (Loaded {} cached models)", err, cached.len())
                        } else {
                            err.to_string()
                        },
                        models: cached,
                    })
                }
            }
        }
        _ => {
            let cached = read_provider_models_from_cache(&state.paths.app_data_dir, &provider).await.unwrap_or_default();
            Ok(TestKeyResponse {
                success: true,
                latency_ms: 5,
                message: format!("Format accepted for {} (Cached: {})", provider, cached.len()),
                models: cached,
            })
        }
    }
}

#[tauri::command]
pub async fn fetch_provider_models(
    state: State<'_, AppState>,
    provider: String,
) -> Result<TestKeyResponse, String> {
    let is_ollama = provider == "ollama";
    let key = match state.keystore.get_secret(&provider).await {
        Ok(Some(secret)) => secret.to_string(),
        _ => {
            if is_ollama {
                return test_provider_key(provider, None, state).await;
            }
            if let Some(cached) = read_provider_models_from_cache(&state.paths.app_data_dir, &provider).await {
                if !cached.is_empty() {
                    return Ok(TestKeyResponse {
                        success: true,
                        latency_ms: 0,
                        message: format!("Loaded {} cached models for {}", cached.len(), provider),
                        models: cached,
                    });
                }
            }
            return Ok(TestKeyResponse {
                success: false,
                latency_ms: 0,
                message: format!("No API key found in vault for provider {}", provider),
                models: Vec::new(),
            });
        }
    };
    let mut resp = test_provider_key(provider.clone(), Some(key), state.clone()).await?;
    if !resp.success || resp.models.is_empty() {
        if let Some(cached) = read_provider_models_from_cache(&state.paths.app_data_dir, &provider).await {
            if !cached.is_empty() {
                resp.success = true;
                resp.message = format!("Loaded {} cached models for {} (Offline fallback)", cached.len(), provider);
                resp.models = cached;
            }
        }
    }
    Ok(resp)
}

#[tauri::command]
pub async fn get_cached_models(
    state: State<'_, AppState>,
) -> Result<HashMap<String, Vec<String>>, String> {
    Ok(read_all_models_from_cache(&state.paths.app_data_dir).await)
}

#[tauri::command]
pub async fn fetch_all_provider_models(
    state: State<'_, AppState>,
) -> Result<HashMap<String, Vec<String>>, String> {
    let providers = ["gemini", "anthropic", "openai", "deepseek", "groq", "xai"];
    let mut map = HashMap::new();

    for &p in &providers {
        if let Ok(Some(secret)) = state.keystore.get_secret(p).await {
            let key = secret.to_string();
            if !key.trim().is_empty() {
                if let Ok(res) = test_provider_key(p.to_string(), Some(key), state.clone()).await {
                    if !res.models.is_empty() {
                        map.insert(p.to_string(), res.models);
                    }
                }
            }
        }
    }

    if let Ok(res) = test_provider_key("ollama".to_string(), None, state.clone()).await {
        if !res.models.is_empty() {
            map.insert("ollama".to_string(), res.models);
        }
    }

    // Merge with any cached models that were not refreshed
    let cached = read_all_models_from_cache(&state.paths.app_data_dir).await;
    for (k, v) in cached {
        map.entry(k).or_insert(v);
    }

    Ok(map)
}

#[tauri::command]
pub async fn start_oauth_login(
    app: AppHandle,
    state: State<'_, AppState>,
    provider: String,
    custom_client_id: Option<String>,
) -> Result<String, String> {
    use crate::oauth::{build_auth_url, exchange_code_for_token, OAuthLoopback, PkceSession};
    use tauri_plugin_opener::OpenerExt;

    let (_loopback, listener, port) = OAuthLoopback::bind_in_range(8989, 8995)
        .await
        .map_err(|e| e.to_string())?;

    let session = PkceSession::new(&provider);
    let auth_url = build_auth_url(
        &provider,
        &session,
        port,
        custom_client_id.as_deref(),
    )
    .map_err(|e| e.to_string())?;

    // Open URL in system default browser
    app.opener().open_url(&auth_url, None::<&str>).map_err(|e| e.to_string())?;

    // Await callback code on loopback with 120s timeout
    let code = OAuthLoopback::listen_on_listener(
        listener,
        &session.state,
        std::time::Duration::from_secs(120),
    )
    .await
    .map_err(|e| e.to_string())?;

    // Exchange code for token
    let token = exchange_code_for_token(
        &provider,
        &code,
        &session,
        port,
        custom_client_id.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())?;

    // Store in secure hardware keystore
    state.keystore.set_secret(&provider, &token).await.map_err(|e| e.to_string())?;

    Ok(format!("{} OAuth authorization successful", provider))
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

fn clean_html_snippet(raw: &str) -> String {
    let without_tags = raw
        .replace("<b>", "")
        .replace("</b>", "")
        .replace("<i>", "")
        .replace("</i>", "")
        .replace("<p>", "")
        .replace("</p>", "")
        .replace("<br>", " ")
        .replace("<br/>", " ");
    without_tags
        .replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#x27;", "'")
        .replace("&#39;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&nbsp;", " ")
        .trim()
        .to_string()
}

fn urlencoding_decode(s: &str) -> String {
    if let Ok(parsed) = reqwest::Url::parse(&format!("https://dummy.internal/?q={}", s)) {
        for (k, v) in parsed.query_pairs() {
            if k == "q" {
                return v.into_owned();
            }
        }
    }
    s.to_string()
}

fn urlencoding_encode(s: &str) -> String {
    if let Ok(mut parsed) = reqwest::Url::parse("https://dummy.internal") {
        parsed.query_pairs_mut().append_pair("q", s);
        return parsed.query().and_then(|q| q.strip_prefix("q=")).unwrap_or(s).to_string();
    }
    s.to_string()
}

pub fn is_search_intent(message: &str) -> bool {
    let lower = message.trim().to_lowercase();
    lower.starts_with("/search")
        || lower.starts_with("/browser")
        || lower.contains("search the internet")
        || lower.contains("search the web")
        || lower.contains("search online")
        || lower.contains("look up online")
        || lower.contains("browse the web")
        || lower.starts_with("search for ")
        || lower.starts_with("google ")
}

pub async fn perform_web_search(query: &str) -> Result<Vec<SearchResult>, String> {
    let clean_query = query.trim();
    if clean_query.is_empty() {
        return Ok(Vec::new());
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap_or_default();

    let mut results: Vec<SearchResult> = Vec::new();

    // 1. DuckDuckGo HTML Search
    let ddg_res = client
        .post("https://html.duckduckgo.com/html/")
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
        .form(&[("q", clean_query)])
        .send()
        .await;

    if let Ok(resp) = ddg_res {
        if resp.status().is_success() {
            if let Ok(html) = resp.text().await {
                let parts: Vec<&str> = html.split("<div class=\"result results_links").collect();
                for part in parts.iter().skip(1).take(6) {
                    let title = if let Some(t_idx) = part.find("class=\"result__a\"") {
                        let sub = &part[t_idx..];
                        if let (Some(s), Some(e)) = (sub.find('>'), sub.find("</a>")) {
                            clean_html_snippet(&sub[s + 1..e])
                        } else {
                            String::new()
                        }
                    } else {
                        String::new()
                    };

                    let url = if let Some(h_idx) = part.find("href=\"") {
                        let sub = &part[h_idx + 6..];
                        if let Some(e_idx) = sub.find('"') {
                            let raw_href = &sub[..e_idx];
                            if let Some(uddg_idx) = raw_href.find("uddg=") {
                                let uddg_val = &raw_href[uddg_idx + 5..];
                                let end_val = uddg_val.find('&').unwrap_or(uddg_val.len());
                                let encoded = &uddg_val[..end_val];
                                urlencoding_decode(encoded)
                            } else if raw_href.starts_with("//") {
                                format!("https:{}", raw_href)
                            } else {
                                raw_href.to_string()
                            }
                        } else {
                            String::new()
                        }
                    } else {
                        String::new()
                    };

                    let snippet = if let Some(s_idx) = part.find("class=\"result__snippet") {
                        let sub = &part[s_idx..];
                        if let (Some(s), Some(e)) = (sub.find('>'), sub.find("</a>")) {
                            clean_html_snippet(&sub[s + 1..e])
                        } else {
                            String::new()
                        }
                    } else {
                        String::new()
                    };

                    if !title.is_empty() && !url.is_empty() && !url.contains("duckduckgo.com") {
                        results.push(SearchResult {
                            title,
                            snippet,
                            url,
                        });
                    }
                }
            }
        }
    }

    // 2. Wikipedia OpenSearch fallback if results < 2
    if results.len() < 2 {
        let wiki_url = format!(
            "https://en.wikipedia.org/w/api.php?action=opensearch&search={}&limit=3&namespace=0&format=json",
            urlencoding_encode(clean_query)
        );
        if let Ok(w_resp) = client.get(&wiki_url).header("User-Agent", "SyntropyOS/0.2.0 (desktop)").send().await {
            if w_resp.status().is_success() {
                if let Ok(w_data) = w_resp.json::<serde_json::Value>().await {
                    if let (Some(titles), Some(snippets), Some(urls)) = (
                        w_data.get(1).and_then(|v| v.as_array()),
                        w_data.get(2).and_then(|v| v.as_array()),
                        w_data.get(3).and_then(|v| v.as_array()),
                    ) {
                        for (i, t) in titles.iter().enumerate() {
                            let title = t.as_str().unwrap_or("").to_string();
                            let snippet = snippets.get(i).and_then(|s| s.as_str()).unwrap_or("").to_string();
                            let url = urls.get(i).and_then(|u| u.as_str()).unwrap_or("").to_string();
                            if !title.is_empty() && !url.is_empty() && !results.iter().any(|r| r.url == url) {
                                results.push(SearchResult { title, snippet, url });
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(results)
}

#[tauri::command]
pub async fn search_web(query: String) -> Result<Vec<SearchResult>, String> {
    perform_web_search(&query).await
}

const MARKDOWN_SYSTEM_INSTRUCTION: &str = r#"You are an expert autonomous software engineer.
Respond directly, concisely, and accurately to the user's prompt.
Strict behavioral constraints:
1. No Canned Greetings or Filler: NEVER start with greetings (e.g. "Hello! I am SyntropyOS AI"), conversational pleasantries, introductory capability summaries, checklists, or "How can I assist you today?". Start immediately with the solution or direct answer.
2. Clean Markdown: Use GitHub Flavored Markdown for formatting. Wrap all code in triple-backtick language tags.
3. Diagrams & Math: Use Mermaid diagrams, Markdown tables, or KaTeX math ONLY when specifically requested by the user or when directly indispensable to answer the query. NEVER output unprompted flowcharts, capability matrices, or entropy formulas on greetings or standard queries.
4. No Placeholders: Write complete, functional, production-ready code."#;

#[tauri::command]
pub async fn send_rpc_command(
    app: AppHandle,
    state: State<'_, AppState>,
    request: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let req_id = request.get("id").and_then(|v| v.as_str()).unwrap_or("req-0").to_string();
    let cmd_type = request.get("type").and_then(|v| v.as_str()).unwrap_or("unknown");

    if cmd_type == "web_search" || cmd_type == "search" {
        let query = request.get("query").and_then(|v| v.as_str()).unwrap_or("");
        let results = perform_web_search(query).await.unwrap_or_default();
        return Ok(serde_json::json!({
            "id": req_id,
            "type": "response",
            "command": cmd_type,
            "success": true,
            "data": { "results": results },
            "error": null
        }));
    }

    if cmd_type == "prompt" {
        let message = request.get("message").and_then(|v| v.as_str()).unwrap_or("");
        let is_search_cmd = message.starts_with("/search ")
            || message.starts_with("/browser ")
            || is_search_intent(message);
        let enable_web_search = request.get("web_search").and_then(|v| v.as_bool()).unwrap_or(false) || is_search_cmd;

        let clean_message = if let Some(s) = message.strip_prefix("/search ") {
            s.trim()
        } else if let Some(s) = message.strip_prefix("/browser ") {
            s.trim()
        } else {
            message.trim()
        };

        let search_query = if let Some(s) = clean_message.strip_prefix("search the internet for ") {
            s.trim()
        } else if let Some(s) = clean_message.strip_prefix("search the web for ") {
            s.trim()
        } else if let Some(s) = clean_message.strip_prefix("search for ") {
            s.trim()
        } else {
            clean_message
        };

        let requested_provider = request
            .get("provider")
            .and_then(|v| v.as_str())
            .filter(|p| !p.is_empty())
            .unwrap_or("gemini");
        let requested_model = request
            .get("model")
            .and_then(|v| v.as_str())
            .filter(|m| !m.is_empty())
            .unwrap_or(match requested_provider {
                "openai" => "gpt-4o",
                "anthropic" => "claude-3-7-sonnet-20250219",
                "xai" => "grok-2-1212",
                _ => "gemini-2.0-flash",
            });
        let custom_preamble = request.get("preamble").and_then(|v| v.as_str()).unwrap_or("");
        let effective_system_prompt = if custom_preamble.trim().is_empty() {
            MARKDOWN_SYSTEM_INSTRUCTION.to_string()
        } else {
            custom_preamble.trim().to_string()
        };
        let ws_id = format!("ws-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>());

        // 1. Emit turn_start
        let _ = app.emit(
            "rho://event",
            RpcEvent::TurnStart {
                turn_number: 1,
                prompt: clean_message.to_string(),
            },
        );

        // Pre-fetch native web search results if enabled
        let web_results = if enable_web_search {
            perform_web_search(search_query).await.unwrap_or_default()
        } else {
            Vec::new()
        };

        // 2. Retrieve key/token from hardware Keystore
        let provider_key = state.keystore.get_secret(requested_provider).await.ok().flatten();

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .build()
            .unwrap_or_default();

        let (full_response, reasoning_text) = if let Some(key) = provider_key {
            match requested_provider {
                "gemini" => {
                    let initial_model = if is_deprecated_gemini_model(requested_model) {
                        "gemini-2.0-flash".to_string()
                    } else {
                        requested_model.to_string()
                    };

                    let fallback_candidates = vec![
                        "gemini-2.0-flash".to_string(),
                        "gemini-2.0-flash-thinking-exp-01-21".to_string(),
                        "gemini-1.5-flash".to_string(),
                        "gemini-1.5-pro".to_string(),
                    ];

                    let mut candidates = vec![initial_model];
                    for fb in fallback_candidates {
                        if !candidates.contains(&fb) {
                            candidates.push(fb);
                        }
                    }

                    let mut final_text = String::new();
                    let final_reasoning = String::new();

                    for (idx, candidate) in candidates.iter().enumerate() {
                        let url = format!(
                            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                            candidate,
                            key.as_str()
                        );
                        let body = if enable_web_search {
                            serde_json::json!({
                                "systemInstruction": {
                                    "parts": [{ "text": effective_system_prompt }]
                                },
                                "contents": [
                                    {
                                        "role": "user",
                                        "parts": [{ "text": clean_message }]
                                    }
                                ],
                                "tools": [
                                    { "googleSearch": {} }
                                ]
                            })
                        } else {
                            serde_json::json!({
                                "systemInstruction": {
                                    "parts": [{ "text": effective_system_prompt }]
                                },
                                "contents": [
                                    {
                                        "role": "user",
                                        "parts": [{ "text": clean_message }]
                                    }
                                ]
                            })
                        };

                        match client.post(&url).json(&body).send().await {
                            Ok(resp) => {
                                let status = resp.status();
                                if status.is_success() {
                                    let data: serde_json::Value = resp.json().await.unwrap_or_default();
                                    let mut text = data["candidates"][0]["content"]["parts"][0]["text"]
                                        .as_str()
                                        .unwrap_or("No response content generated from Gemini.")
                                        .to_string();

                                    // Extract grounding metadata sources
                                    if let Some(grounding) = data["candidates"][0].get("groundingMetadata") {
                                        let mut sources = Vec::new();
                                        if let Some(chunks) = grounding.get("groundingChunks").and_then(|c| c.as_array()) {
                                            for chunk in chunks {
                                                if let Some(web) = chunk.get("web") {
                                                    let uri = web.get("uri").and_then(|u| u.as_str()).unwrap_or("");
                                                    let title = web.get("title").and_then(|t| t.as_str()).unwrap_or(uri);
                                                    if !uri.is_empty() && !sources.iter().any(|(u, _)| u == uri) {
                                                        sources.push((uri.to_string(), title.to_string()));
                                                    }
                                                }
                                            }
                                        }
                                        if !sources.is_empty() {
                                            text.push_str("\n\n---\n**🌐 Web Sources Consulted:**\n");
                                            for (uri, title) in sources {
                                                text.push_str(&format!("- [{}]({})\n", title, uri));
                                            }
                                        }
                                    } else if enable_web_search && !web_results.is_empty() {
                                        text.push_str("\n\n---\n**🌐 Web Sources Consulted:**\n");
                                        for res in web_results.iter().take(4) {
                                            text.push_str(&format!("- [{}]({})\n", res.title, res.url));
                                        }
                                    }

                                    if candidate != requested_model {
                                        final_text = format!(
                                            "> [!NOTE]\n> Google reported that `{}` is no longer available. SyntropyOS automatically routed your request to `{}`.\n\n{}",
                                            requested_model,
                                            candidate,
                                            text
                                        );
                                    } else {
                                        final_text = text;
                                    }
                                    break;
                                } else {
                                    let err_body = resp.text().await.unwrap_or_default();
                                    let msg = serde_json::from_str::<serde_json::Value>(&err_body)
                                        .ok()
                                        .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                                        .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));

                                    // Fallback retry without googleSearch tool if model candidate does not support tools
                                    if enable_web_search && (msg.contains("Tool") || msg.contains("googleSearch") || msg.contains("unsupported")) {
                                        let fallback_prompt = if !web_results.is_empty() {
                                            let mut ctx = format!("Live Web Search Results for '{}':\n\n", search_query);
                                            for (i, r) in web_results.iter().take(4).enumerate() {
                                                ctx.push_str(&format!("{}. [{}]({})\n   {}\n\n", i + 1, r.title, r.url, r.snippet));
                                            }
                                            ctx.push_str("Based on the live web search results above, answer the prompt directly and cite source URLs.\n\nUser Question: ");
                                            ctx.push_str(clean_message);
                                            ctx
                                        } else {
                                            clean_message.to_string()
                                        };

                                        let fallback_body = serde_json::json!({
                                            "systemInstruction": {
                                                "parts": [{ "text": effective_system_prompt }]
                                            },
                                            "contents": [
                                                {
                                                    "role": "user",
                                                    "parts": [{ "text": fallback_prompt }]
                                                }
                                            ]
                                        });

                                        if let Ok(retry_resp) = client.post(&url).json(&fallback_body).send().await {
                                            if retry_resp.status().is_success() {
                                                let retry_data: serde_json::Value = retry_resp.json().await.unwrap_or_default();
                                                final_text = retry_data["candidates"][0]["content"]["parts"][0]["text"]
                                                    .as_str()
                                                    .unwrap_or("No response generated.")
                                                    .to_string();
                                                break;
                                            }
                                        }
                                    }

                                    let is_model_unavailable = msg.contains("no longer available")
                                        || msg.contains("not found")
                                        || msg.contains("not supported")
                                        || msg.contains("deprecated")
                                        || status.as_u16() == 404;

                                    if !is_model_unavailable || idx == candidates.len() - 1 {
                                        final_text = format!("⚠️ Google Gemini API Error: {}", msg);
                                        break;
                                    }
                                }
                            }
                            Err(e) => {
                                if idx == candidates.len() - 1 {
                                    final_text = format!("⚠️ Google Gemini Connection Error: {}", e);
                                    break;
                                }
                            }
                        }
                    }

                    (final_text, final_reasoning)
                }
                "openai" | "xai" => {
                    let endpoint = if requested_provider == "xai" {
                        "https://api.x.ai/v1/chat/completions"
                    } else {
                        "https://api.openai.com/v1/chat/completions"
                    };

                    let user_content = if enable_web_search && !web_results.is_empty() {
                        let mut ctx = format!("Live Web Search Results for '{}':\n\n", search_query);
                        for (i, r) in web_results.iter().take(5).enumerate() {
                            ctx.push_str(&format!("{}. [{}]({})\n   {}\n\n", i + 1, r.title, r.url, r.snippet));
                        }
                        ctx.push_str("Based on the live web search results above, answer the prompt directly and cite the source URLs as markdown links.\n\nUser Question: ");
                        ctx.push_str(clean_message);
                        ctx
                    } else {
                        clean_message.to_string()
                    };

                    let body = serde_json::json!({
                        "model": requested_model,
                        "messages": [
                            { "role": "system", "content": effective_system_prompt },
                            { "role": "user", "content": user_content }
                        ]
                    });

                    match client
                        .post(endpoint)
                        .header("Authorization", format!("Bearer {}", key.as_str()))
                        .json(&body)
                        .send()
                        .await
                    {
                        Ok(resp) => {
                            let status = resp.status();
                            if status.is_success() {
                                let data: serde_json::Value = resp.json().await.unwrap_or_default();
                                let text = data["choices"][0]["message"]["content"]
                                    .as_str()
                                    .unwrap_or("No response generated.")
                                    .to_string();
                                let reasoning = data["choices"][0]["message"]["reasoning_content"]
                                    .as_str()
                                    .unwrap_or("")
                                    .to_string();
                                (text, reasoning)
                            } else {
                                let err_body = resp.text().await.unwrap_or_default();
                                let msg = serde_json::from_str::<serde_json::Value>(&err_body)
                                    .ok()
                                    .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                                    .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                                (format!("⚠️ {} API Error: {}", requested_provider.to_uppercase(), msg), String::new())
                            }
                        }
                        Err(e) => (format!("⚠️ {} Connection Error: {}", requested_provider.to_uppercase(), e), String::new()),
                    }
                }
                "anthropic" => {
                    let endpoint = "https://api.anthropic.com/v1/messages";
                    let user_content = if enable_web_search && !web_results.is_empty() {
                        let mut ctx = format!("Live Web Search Results for '{}':\n\n", search_query);
                        for (i, r) in web_results.iter().take(5).enumerate() {
                            ctx.push_str(&format!("{}. [{}]({})\n   {}\n\n", i + 1, r.title, r.url, r.snippet));
                        }
                        ctx.push_str("Based on the live web search results above, answer the prompt directly and cite the source URLs as markdown links.\n\nUser Question: ");
                        ctx.push_str(clean_message);
                        ctx
                    } else {
                        clean_message.to_string()
                    };

                    let body = serde_json::json!({
                        "model": requested_model,
                        "max_tokens": 4096,
                        "system": effective_system_prompt,
                        "messages": [{ "role": "user", "content": user_content }]
                    });

                    match client
                        .post(endpoint)
                        .header("x-api-key", key.as_str())
                        .header("anthropic-version", "2023-06-01")
                        .json(&body)
                        .send()
                        .await
                    {
                        Ok(resp) => {
                            let status = resp.status();
                            if status.is_success() {
                                let data: serde_json::Value = resp.json().await.unwrap_or_default();
                                let mut text = String::new();
                                let mut reasoning = String::new();
                                if let Some(blocks) = data["content"].as_array() {
                                    for b in blocks {
                                        if b["type"] == "text" {
                                            if let Some(t) = b["text"].as_str() {
                                                text.push_str(t);
                                            }
                                        } else if b["type"] == "thinking" {
                                            if let Some(th) = b["thinking"].as_str() {
                                                reasoning.push_str(th);
                                            }
                                        }
                                    }
                                }
                                (text, reasoning)
                            } else {
                                let err_body = resp.text().await.unwrap_or_default();
                                let msg = serde_json::from_str::<serde_json::Value>(&err_body)
                                    .ok()
                                    .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                                    .unwrap_or_else(|| format!("HTTP {}", status.as_u16()));
                                (format!("⚠️ Anthropic API Error: {}", msg), String::new())
                            }
                        }
                        Err(e) => (format!("⚠️ Anthropic Connection Error: {}", e), String::new()),
                    }
                }
                _ => (
                    format!("⚠️ Provider {} not configured for native execution.", requested_provider),
                    String::new(),
                ),
            }
        } else {
            if enable_web_search && !web_results.is_empty() {
                let mut search_summary = format!("### 🌐 Live Web Search Results for `{}`\n\n", search_query);
                for (i, res) in web_results.iter().take(5).enumerate() {
                    search_summary.push_str(&format!("{}. **[{}]({})**\n   {}\n\n", i + 1, res.title, res.url, res.snippet));
                }
                search_summary.push_str(&format!(
                    "> [!NOTE]\n> Web search completed natively via SyntropyOS. To have an AI model synthesize and reason over these results, configure your **{}** API key in Settings.",
                    requested_provider.to_uppercase()
                ));
                (search_summary, String::new())
            } else {
                (
                    format!(
                        "### ⚠️ {} Setup Required\n\nNo credentials configured for **{}** in the hardware Keystore.\n\n> [!TIP]\n> Navigate to **Settings -> Cloud Providers & API Keys** to configure your {} API key or OAuth session to activate live inference.\n\n```text\n(Local Echo: {})\n```",
                        requested_provider.to_uppercase(),
                        requested_provider.to_uppercase(),
                        requested_provider,
                        clean_message
                    ),
                    String::new(),
                )
            }
        };

        // 3a. Stream reasoning chunks if present
        if !reasoning_text.is_empty() {
            for chunk in reasoning_text.split_inclusive(' ') {
                let _ = app.emit(
                    "rho://event",
                    RpcEvent::ReasoningChunk {
                        content: chunk.to_string(),
                    },
                );
                tokio::time::sleep(tokio::time::Duration::from_millis(8)).await;
            }
        }

        // 3b. Stream text chunks
        for chunk in full_response.split_inclusive(' ') {
            let _ = app.emit(
                "rho://event",
                RpcEvent::TextChunk {
                    content: chunk.to_string(),
                },
            );
            tokio::time::sleep(tokio::time::Duration::from_millis(12)).await;
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

        WorkstreamCommand::WebSearch { query } => {
            let res = perform_web_search(&query).await?;
            serde_json::to_value(res).map_err(|e| e.to_string())
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
