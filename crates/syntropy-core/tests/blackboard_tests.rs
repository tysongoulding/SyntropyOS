use syntropy_core::blackboard::{ArtifactUri, BlackboardArtifact, BlackboardError, BlackboardStore};
use std::sync::Arc;

#[test]
fn test_valid_uri_parsing() {
    let uri_str = "blackboard://sprint-001/team-research/sme_scout/user_journey@v1";
    let uri = ArtifactUri::parse(uri_str).expect("Valid URI should parse");
    assert_eq!(uri.workstream_id, "sprint-001");
    assert_eq!(uri.team_id, "team-research");
    assert_eq!(uri.agent_id, "sme_scout");
    assert_eq!(uri.artifact_name, "user_journey");
    assert_eq!(uri.version, 1);
    assert_eq!(uri.to_string(), uri_str);
}

#[test]
fn test_invalid_uri_parsing() {
    assert!(ArtifactUri::parse("http://example.com").is_err());
    assert!(ArtifactUri::parse("blackboard://sprint-001/team").is_err());
    assert!(ArtifactUri::parse("blackboard://sprint-001/team/agent/doc").is_err()); // missing @v
    assert!(ArtifactUri::parse("blackboard://sprint-001/team/agent/doc@vABC").is_err()); // non-numeric version
}

#[tokio::test]
async fn test_author_write_acl_enforcement() {
    let store = BlackboardStore::new_in_memory();

    let uri_str = "blackboard://sprint-001/team-research/sme_scout/user_journey@v1";
    let artifact = BlackboardArtifact::new(
        uri_str,
        "sme_scout",
        "Initial User Journey Analysis",
        "{\"journeys\": [\"discovery\", \"checkout\"]}",
        "application/json",
    ).expect("Artifact creation should succeed");

    // Authorized write: author matches URI namespace
    let result = store.publish("sme_scout", artifact.clone()).await;
    assert!(result.is_ok(), "Authorized author should be permitted to write");

    // Unauthorized write: author does NOT match URI namespace
    let unauthorized_artifact = BlackboardArtifact::new(
        "blackboard://sprint-001/team-research/sme_scout/malicious_overwrite@v1",
        "sme_hacker",
        "Hacked content",
        "{}",
        "application/json",
    ).expect("Artifact creation should succeed");

    let denied_result = store.publish("sme_hacker", unauthorized_artifact).await;
    assert!(
        matches!(denied_result, Err(BlackboardError::WriteAccessDenied { .. })),
        "Unauthorized agent must be rejected with WriteAccessDenied"
    );
}

#[tokio::test]
async fn test_version_increment_and_lookup() {
    let store = BlackboardStore::new_in_memory();

    let a1 = BlackboardArtifact::new(
        "blackboard://ws-1/team-core/agent-1/spec@v1",
        "agent-1",
        "Spec V1",
        "draft 1",
        "text/markdown",
    ).unwrap();
    store.publish("agent-1", a1).await.unwrap();

    let a2 = BlackboardArtifact::new(
        "blackboard://ws-1/team-core/agent-1/spec@v2",
        "agent-1",
        "Spec V2",
        "draft 2 updated",
        "text/markdown",
    ).unwrap();
    store.publish("agent-1", a2).await.unwrap();

    // Fetch specific version
    let fetched_v1 = store.get("blackboard://ws-1/team-core/agent-1/spec@v1").await.unwrap();
    assert_eq!(fetched_v1.content, "draft 1");
    assert_eq!(fetched_v1.version, 1);

    let fetched_v2 = store.get("blackboard://ws-1/team-core/agent-1/spec@v2").await.unwrap();
    assert_eq!(fetched_v2.content, "draft 2 updated");
    assert_eq!(fetched_v2.version, 2);

    // Fetch latest
    let latest = store.get_latest("ws-1", "team-core", "agent-1", "spec").await.unwrap();
    assert_eq!(latest.version, 2);
    assert_eq!(latest.content, "draft 2 updated");
}

#[tokio::test]
async fn test_signal_bus_broadcast() {
    let store = Arc::new(BlackboardStore::new_in_memory());
    let mut rx = store.subscribe();

    let a = BlackboardArtifact::new(
        "blackboard://ws-broadcast/t1/a1/plan@v1",
        "a1",
        "Architecture Plan",
        "Content payload that is large and omitted in signal",
        "text/plain",
    ).unwrap();

    store.publish("a1", a).await.unwrap();

    let signal = rx.recv().await.expect("Signal should be received");
    assert_eq!(signal.uri, "blackboard://ws-broadcast/t1/a1/plan@v1");
    assert_eq!(signal.author_id, "a1");
    assert_eq!(signal.title, "Architecture Plan");
    assert_eq!(signal.version, 1);
    // Notice: signal contains lightweight metadata, not full content
}
