use syntropy_os_lib::protocol::{WorkstreamCommand, WorkstreamEvent};

#[test]
fn test_protocol_command_serialization() {
    let cmd = WorkstreamCommand::LaunchWorkstream {
        blueprint_id: "sprint-1hour".to_string(),
        workstream_name: "Q3 Sprint".to_string(),
        params: serde_json::json!({"lead": "pm_1"}),
    };

    let json = serde_json::to_string(&cmd).unwrap();
    assert!(json.contains("launch_workstream"));
    assert!(json.contains("blueprint_id"));
    assert!(json.contains("workstream_name"));

    let deserialized: WorkstreamCommand = serde_json::from_str(&json).unwrap();
    match deserialized {
        WorkstreamCommand::LaunchWorkstream { blueprint_id, .. } => {
            assert_eq!(blueprint_id, "sprint-1hour");
        }
        _ => panic!("Wrong variant deserialized"),
    }
}

#[test]
fn test_protocol_event_serialization() {
    let event = WorkstreamEvent::ArtifactPublished {
        uri: "blackboard://ws1/team1/agent1/doc@v1".to_string(),
        title: "Test Plan".to_string(),
        author: "agent1".to_string(),
        version: 1,
        size_bytes: 1024,
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("artifact_published"));
    assert!(json.contains("size_bytes"));
    assert!(json.contains("author"));

    let deserialized: WorkstreamEvent = serde_json::from_str(&json).unwrap();
    match deserialized {
        WorkstreamEvent::ArtifactPublished { version, .. } => {
            assert_eq!(version, 1);
        }
        _ => panic!("Wrong variant deserialized"),
    }
}

#[test]
fn test_window_config() {
    let conf = r##"{
        "title": "SyntropyOS",
        "theme": "Dark",
        "backgroundColor": "#0d1117"
    }"##;
    let win: tauri::utils::config::WindowConfig = serde_json::from_str(conf).unwrap();
    assert_eq!(win.theme, Some(tauri::Theme::Dark));
    assert_eq!(win.background_color, Some(tauri::window::Color(13, 17, 23, 255)));
}

#[test]
fn test_test_key_response_contract() {
    use syntropy_os_lib::protocol::TestKeyResponse;
    let res = TestKeyResponse {
        success: true,
        latency_ms: 120,
        message: "Google Gemini Verified (200)".to_string(),
    };
    let json = serde_json::to_string(&res).unwrap();
    assert!(json.contains("success"));
    assert!(json.contains("latency_ms"));
    assert!(json.contains("message"));
}

#[test]
fn test_rpc_event_contract() {
    use syntropy_os_lib::protocol::RpcEvent;
    let ev = RpcEvent::TextChunk {
        content: "Hello Gemini".to_string(),
    };
    let json = serde_json::to_string(&ev).unwrap();
    assert!(json.contains("\"type\":\"text_chunk\""));
    assert!(json.contains("\"content\":\"Hello Gemini\""));
}
