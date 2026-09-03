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
