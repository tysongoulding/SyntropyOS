use chrono::{DateTime, Utc};
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Arc;
use thiserror::Error;
use tokio::sync::{broadcast, RwLock};

#[derive(Error, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum BlackboardError {
    #[error("Invalid Blackboard URI format: {0}")]
    InvalidUri(String),

    #[error("Write access denied: Author '{caller_id}' cannot write to namespace of '{target_agent_id}'")]
    WriteAccessDenied {
        caller_id: String,
        target_agent_id: String,
    },

    #[error("Unauthorized mutation: Agent '{attempted_by}' attempted to mutate target namespace '{target}'")]
    UnauthorizedMutation {
        attempted_by: String,
        target: String,
    },

    #[error("Namespace '{0}' is frozen (immutable phase lock) and cannot be mutated")]
    FrozenNamespace(String),

    #[error("Artifact not found: {0}")]
    ArtifactNotFound(String),

    #[error("Manifest not found: {0}")]
    ManifestNotFound(String),

    #[error("IO error persisting blackboard: {0}")]
    IoError(String),
}

impl From<std::io::Error> for BlackboardError {
    fn from(err: std::io::Error) -> Self {
        BlackboardError::IoError(err.to_string())
    }
}

// -----------------------------------------------------------------------------
// Zero-Trust Agent Identity & Access Control (WriteAclGuard)
// -----------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AgentIdentity {
    pub agent_id: String,
    pub namespace: String,
    pub is_admin: bool,
}

impl AgentIdentity {
    pub fn new(agent_id: &str, namespace: &str) -> Self {
        Self {
            agent_id: agent_id.to_string(),
            namespace: namespace.to_string(),
            is_admin: false,
        }
    }

    pub fn new_admin(agent_id: &str) -> Self {
        Self {
            agent_id: agent_id.to_string(),
            namespace: "*".to_string(),
            is_admin: true,
        }
    }

    pub fn is_system_admin(&self) -> bool {
        self.is_admin
    }
}

pub struct WriteAclGuard;

impl WriteAclGuard {
    pub fn enforce_mutation(
        caller: &AgentIdentity,
        target_namespace: &str,
        is_frozen: bool,
    ) -> Result<(), BlackboardError> {
        if is_frozen && !caller.is_system_admin() {
            return Err(BlackboardError::FrozenNamespace(target_namespace.to_string()));
        }

        if caller.namespace != target_namespace && !caller.is_system_admin() {
            return Err(BlackboardError::UnauthorizedMutation {
                attempted_by: caller.agent_id.clone(),
                target: target_namespace.to_string(),
            });
        }

        Ok(())
    }
}

// -----------------------------------------------------------------------------
// Invariants & Deterministic Verification Engine (Tier 0)
// -----------------------------------------------------------------------------

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct NamespaceInvariants {
    pub produces: Vec<String>,
    pub prohibits: Vec<String>,
    pub assumes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct InvariantConflict {
    pub rule: String,
    pub producer_namespace: String,
    pub prohibiter_namespace: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MissingAssumption {
    pub rule: String,
    pub consumer_namespace: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct InvariantVerificationResult {
    pub is_valid: bool,
    pub conflicts: Vec<InvariantConflict>,
    pub missing_assumptions: Vec<MissingAssumption>,
}

pub struct DeterministicInvariantEngine;

impl DeterministicInvariantEngine {
    /// Tier 0: Deterministic Invariant Engine (Rust-native static schema & rule check, 0 Tokens).
    /// Compares `produces` vs. `prohibits` across front-matter contracts.
    pub fn verify(manifest: &BlackboardManifest) -> InvariantVerificationResult {
        let mut all_produced: HashMap<String, String> = HashMap::new(); // rule -> producer_ns
        let mut conflicts = Vec::new();
        let mut missing_assumptions = Vec::new();

        // 1. Gather all produces
        for (ns, entry) in &manifest.namespaces {
            for prod in &entry.invariants.produces {
                all_produced.insert(prod.clone(), ns.clone());
            }
        }

        // 2. Check prohibits against produces
        for (ns, entry) in &manifest.namespaces {
            for proh in &entry.invariants.prohibits {
                if let Some(producer) = all_produced.get(proh) {
                    conflicts.push(InvariantConflict {
                        rule: proh.clone(),
                        producer_namespace: producer.clone(),
                        prohibiter_namespace: ns.clone(),
                    });
                }
            }
        }

        // 3. Check assumes against produces
        for (ns, entry) in &manifest.namespaces {
            for assume in &entry.invariants.assumes {
                if !all_produced.contains_key(assume) {
                    missing_assumptions.push(MissingAssumption {
                        rule: assume.clone(),
                        consumer_namespace: ns.clone(),
                    });
                }
            }
        }

        let is_valid = conflicts.is_empty();
        InvariantVerificationResult {
            is_valid,
            conflicts,
            missing_assumptions,
        }
    }
}

// -----------------------------------------------------------------------------
// Dual-Plane Architecture: Data Plane & Presentation Plane
// -----------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NamespaceEntry {
    pub artifact_uri: String,
    pub author_id: String,
    pub status: String, // "completed", "running", "frozen"
    pub invariants: NamespaceInvariants,
    pub blob_hash: String,
    pub summary: String,
    pub updated_at: DateTime<Utc>,
}

/// Data Plane (Machine Authoritative):
/// Content-addressed JSON manifest retaining URI pointers and invariant metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlackboardManifest {
    pub board_id: String,
    pub version: u64,
    pub namespaces: HashMap<String, NamespaceEntry>,
}

impl BlackboardManifest {
    pub fn new(board_id: &str) -> Self {
        Self {
            board_id: board_id.to_string(),
            version: 1,
            namespaces: HashMap::new(),
        }
    }

    /// Presentation Plane (Human Living Artifact):
    /// Compiles authoritative JSON state into structured Markdown with invisible boundary markers.
    pub fn compile_presentation_markdown(&self) -> String {
        let mut md = format!(
            "# Blackboard Living Presentation Plane: {}\nVersion: {}\n\n",
            self.board_id, self.version
        );

        let mut sorted_keys: Vec<&String> = self.namespaces.keys().collect();
        sorted_keys.sort();

        for ns in sorted_keys {
            if let Some(entry) = self.namespaces.get(ns) {
                md.push_str(&format!(
                    "<!-- BEGIN_NAMESPACE: {} | WRITER: {} -->\n## {}\n- **Status:** {}\n- **Artifact Hash:** sha256:{}\n### Implementation\n{}\n<!-- END_NAMESPACE: {} -->\n\n",
                    ns, entry.author_id, ns, entry.status, entry.blob_hash, entry.summary, ns
                ));
            }
        }

        md
    }
}

// -----------------------------------------------------------------------------
// URI & Artifact Data Structures
// -----------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ArtifactUri {
    pub workstream_id: String,
    pub team_id: String,
    pub agent_id: String,
    pub artifact_name: String,
    pub version: u32,
}

impl ArtifactUri {
    pub fn parse(input: &str) -> Result<Self, BlackboardError> {
        let re = Regex::new(
            r"^blackboard://(?P<ws>[a-zA-Z0-9_\-]+)/(?P<team>[a-zA-Z0-9_\-]+)/(?P<agent>[a-zA-Z0-9_\-]+)/(?P<artifact>[a-zA-Z0-9_\-]+)@v(?P<version>\d+)$"
        ).unwrap();

        let caps = re
            .captures(input)
            .ok_or_else(|| BlackboardError::InvalidUri(input.to_string()))?;

        let version = caps["version"]
            .parse::<u32>()
            .map_err(|_| BlackboardError::InvalidUri(input.to_string()))?;

        Ok(Self {
            workstream_id: caps["ws"].to_string(),
            team_id: caps["team"].to_string(),
            agent_id: caps["agent"].to_string(),
            artifact_name: caps["artifact"].to_string(),
            version,
        })
    }

    pub fn base_key(&self) -> String {
        format!(
            "{}/{}/{}/{}",
            self.workstream_id, self.team_id, self.agent_id, self.artifact_name
        )
    }
}

impl std::fmt::Display for ArtifactUri {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "blackboard://{}/{}/{}/{}@v{}",
            self.workstream_id, self.team_id, self.agent_id, self.artifact_name, self.version
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlackboardArtifact {
    pub uri: String,
    pub author_id: String,
    pub title: String,
    pub content: String,
    pub mime_type: String,
    pub version: u32,
    pub hash: String,
    pub created_at: DateTime<Utc>,
}

impl BlackboardArtifact {
    pub fn new(
        uri_str: &str,
        author_id: &str,
        title: &str,
        content: &str,
        mime_type: &str,
    ) -> Result<Self, BlackboardError> {
        let uri = ArtifactUri::parse(uri_str)?;
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        let hash = hex::encode(hasher.finalize());

        Ok(Self {
            uri: uri.to_string(),
            author_id: author_id.to_string(),
            title: title.to_string(),
            content: content.to_string(),
            mime_type: mime_type.to_string(),
            version: uri.version,
            hash,
            created_at: Utc::now(),
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlackboardSignal {
    pub uri: String,
    pub author_id: String,
    pub title: String,
    pub version: u32,
    pub content_hash: String,
    pub size_bytes: usize,
    pub created_at: DateTime<Utc>,
}

// -----------------------------------------------------------------------------
// Unified Blackboard Store
// -----------------------------------------------------------------------------

pub struct BlackboardStore {
    entries: Arc<RwLock<HashMap<String, Vec<BlackboardArtifact>>>>,
    manifests: Arc<RwLock<HashMap<String, BlackboardManifest>>>,
    frozen_namespaces: Arc<RwLock<HashSet<String>>>,
    blobs: Arc<RwLock<HashMap<String, String>>>, // hash -> content
    disk_path: Option<PathBuf>,
    signal_sender: broadcast::Sender<BlackboardSignal>,
}

impl BlackboardStore {
    pub fn new_in_memory() -> Self {
        let (signal_sender, _) = broadcast::channel(512);
        Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
            manifests: Arc::new(RwLock::new(HashMap::new())),
            frozen_namespaces: Arc::new(RwLock::new(HashSet::new())),
            blobs: Arc::new(RwLock::new(HashMap::new())),
            disk_path: None,
            signal_sender,
        }
    }

    pub fn new_with_persistence(disk_path: PathBuf) -> Self {
        let (signal_sender, _) = broadcast::channel(512);
        Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
            manifests: Arc::new(RwLock::new(HashMap::new())),
            frozen_namespaces: Arc::new(RwLock::new(HashSet::new())),
            blobs: Arc::new(RwLock::new(HashMap::new())),
            disk_path: Some(disk_path),
            signal_sender,
        }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<BlackboardSignal> {
        self.signal_sender.subscribe()
    }

    /// Zero-Trust Author Write Isolation:
    /// An agent can ONLY write to their own namespace `blackboard://{ws}/{team}/{agent}/...`.
    pub async fn publish(
        &self,
        caller_agent_id: &str,
        artifact: BlackboardArtifact,
    ) -> Result<BlackboardSignal, BlackboardError> {
        let uri = ArtifactUri::parse(&artifact.uri)?;

        // Zero-Trust ACL Guard
        if caller_agent_id != uri.agent_id || artifact.author_id != uri.agent_id {
            return Err(BlackboardError::WriteAccessDenied {
                caller_id: caller_agent_id.to_string(),
                target_agent_id: uri.agent_id.clone(),
            });
        }

        let base_key = uri.base_key();
        let signal = BlackboardSignal {
            uri: artifact.uri.clone(),
            author_id: artifact.author_id.clone(),
            title: artifact.title.clone(),
            version: artifact.version,
            content_hash: artifact.hash.clone(),
            size_bytes: artifact.content.len(),
            created_at: artifact.created_at,
        };

        {
            let mut lock = self.entries.write().await;
            let versions = lock.entry(base_key.clone()).or_default();
            versions.push(artifact.clone());
        }

        // Store content-addressed blob
        {
            let mut blob_lock = self.blobs.write().await;
            blob_lock.insert(artifact.hash.clone(), artifact.content.clone());
        }

        // Optional disk spillover
        if let Some(ref root) = self.disk_path {
            let artifact_dir = root
                .join(&uri.workstream_id)
                .join(&uri.team_id)
                .join(&uri.agent_id);
            tokio::fs::create_dir_all(&artifact_dir).await?;
            let file_path = artifact_dir.join(format!("{}_v{}.json", uri.artifact_name, uri.version));
            let json = serde_json::to_string_pretty(&artifact).map_err(std::io::Error::other)?;
            tokio::fs::write(file_path, json).await?;
        }

        // Emit O(1) metadata signal
        let _ = self.signal_sender.send(signal.clone());

        Ok(signal)
    }

    /// Update or insert a namespace entry into the Data Plane manifest under Zero-Trust ACLs.
    pub async fn update_manifest_namespace(
        &self,
        caller: &AgentIdentity,
        board_id: &str,
        target_namespace: &str,
        entry: NamespaceEntry,
    ) -> Result<(), BlackboardError> {
        let is_frozen = {
            let frozen = self.frozen_namespaces.read().await;
            frozen.contains(target_namespace)
        };

        WriteAclGuard::enforce_mutation(caller, target_namespace, is_frozen)?;

        let mut lock = self.manifests.write().await;
        let manifest = lock.entry(board_id.to_string()).or_insert_with(|| BlackboardManifest::new(board_id));
        manifest.version += 1;
        manifest.namespaces.insert(target_namespace.to_string(), entry);

        Ok(())
    }

    /// Freeze a namespace when an execution phase completes (making it immutable).
    pub async fn freeze_namespace(&self, namespace: &str) {
        let mut lock = self.frozen_namespaces.write().await;
        lock.insert(namespace.to_string());
    }

    pub async fn get_manifest(&self, board_id: &str) -> Result<BlackboardManifest, BlackboardError> {
        let lock = self.manifests.read().await;
        lock.get(board_id)
            .cloned()
            .ok_or_else(|| BlackboardError::ManifestNotFound(board_id.to_string()))
    }

    pub async fn get_presentation_markdown(&self, board_id: &str) -> Result<String, BlackboardError> {
        let manifest = self.get_manifest(board_id).await?;
        Ok(manifest.compile_presentation_markdown())
    }

    pub async fn verify_manifest_invariants(&self, board_id: &str) -> Result<InvariantVerificationResult, BlackboardError> {
        let manifest = self.get_manifest(board_id).await?;
        Ok(DeterministicInvariantEngine::verify(&manifest))
    }

    pub async fn get(&self, uri_str: &str) -> Result<BlackboardArtifact, BlackboardError> {
        let uri = ArtifactUri::parse(uri_str)?;
        let lock = self.entries.read().await;
        let base_key = uri.base_key();

        if let Some(versions) = lock.get(&base_key) {
            for art in versions {
                if art.version == uri.version {
                    return Ok(art.clone());
                }
            }
        }

        Err(BlackboardError::ArtifactNotFound(uri_str.to_string()))
    }

    pub async fn get_latest(
        &self,
        workstream_id: &str,
        team_id: &str,
        agent_id: &str,
        artifact_name: &str,
    ) -> Result<BlackboardArtifact, BlackboardError> {
        let base_key = format!("{}/{}/{}/{}", workstream_id, team_id, agent_id, artifact_name);
        let lock = self.entries.read().await;

        if let Some(versions) = lock.get(&base_key) {
            if let Some(latest) = versions.last() {
                return Ok(latest.clone());
            }
        }

        Err(BlackboardError::ArtifactNotFound(format!(
            "blackboard://{}/{}/{}/{}@latest",
            workstream_id, team_id, agent_id, artifact_name
        )))
    }

    pub async fn list_by_workstream(&self, workstream_id: &str) -> Vec<BlackboardArtifact> {
        let lock = self.entries.read().await;
        let mut list = Vec::new();
        let prefix = format!("{}/", workstream_id);

        for (k, versions) in lock.iter() {
            if k.starts_with(&prefix) {
                if let Some(latest) = versions.last() {
                    list.push(latest.clone());
                }
            }
        }

        list
    }
}
