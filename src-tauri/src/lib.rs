pub mod commands;
pub mod keystore;
pub mod oauth;
pub mod paths;
pub mod protocol;

use std::sync::Arc;
use tokio::sync::RwLock;

use commands::{
    close_window, execute_command, get_blackboard_manifest, get_blackboard_presentation,
    get_prompt_config, minimize_window, open_external_url, open_local_path, save_custom_prompt,
    save_lota_settings, send_rpc_command, start_drag_window, sync_provider_keys,
    toggle_maximize_window, verify_invariants, AppState,
};
use keystore::SecureKeystore;
use paths::AppPaths;
use syntropy_core::blackboard::BlackboardStore;
use syntropy_engine::resilience::CircuitBreaker;
use syntropy_engine::routing::ModelRouter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let paths = AppPaths::resolve().expect("Failed to resolve app paths");
    let _ = paths.ensure_directories();

    let blackboard = Arc::new(BlackboardStore::new_with_persistence(paths.blackboard_dir.clone()));
    let keystore = SecureKeystore::new();
    let router = ModelRouter::default();
    let circuit_breaker = CircuitBreaker::default();
    let total_hours_saved = Arc::new(RwLock::new(42.5));

    let app_state = AppState {
        paths,
        keystore,
        blackboard,
        router,
        circuit_breaker,
        total_hours_saved,
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            execute_command,
            start_drag_window,
            minimize_window,
            toggle_maximize_window,
            close_window,
            open_local_path,
            open_external_url,
            sync_provider_keys,
            save_lota_settings,
            send_rpc_command,
            get_prompt_config,
            save_custom_prompt,
            get_blackboard_manifest,
            get_blackboard_presentation,
            verify_invariants,
        ])
        .run(tauri::generate_context!())
        .expect("error while running syntropyOS desktop application");
}
