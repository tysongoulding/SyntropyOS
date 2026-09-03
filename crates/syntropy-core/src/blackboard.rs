use chrono::{DateTime, Utc};
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use thiserror::Error;
use tokio::sync::{broadcast, RwLock};

#[derive(Error, Debug)]
pub enum BlackboardError {
    #[error("Invalid Blackboard URI format: {0}")]
    InvalidUri(String),

    #[error("Write access denied: Author '{caller_id}' cannot write to namespace of '{target_agent_id}'")]
    WriteAccessDenied {
        caller_id: String,
        target_agent_id: String,
    },

    #[error("Artifact not found: {0}")]
    ArtifactNotFound(String),

    #[error("IO error persisting blackboard: {0}")]
    IoError(#[from] std::io::Error),
}

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

        let caps = re.captures(input).ok_or_else(|| BlackboardError::InvalidUri(input.to_string()))?;

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
        format!("{}/{}/{}/{}", self.workstream_id, self.team_id, self.agent_id, self.artifact_name)
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

pub struct BlackboardStore {
    // base_key -> Vec of versioned artifacts
    entries: Arc<RwLock<HashMap<String, Vec<BlackboardArtifact>>>>,
    disk_path: Option<PathBuf>,
    signal_sender: broadcast::Sender<BlackboardSignal>,
}

impl BlackboardStore {
    pub fn new_in_memory() -> Self {
        let (signal_sender, _) = broadcast::channel(512);
        Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
            disk_path: None,
            signal_sender,
        }
    }

    pub fn new_with_persistence(disk_path: PathBuf) -> Self {
        let (signal_sender, _) = broadcast::channel(512);
        Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
            disk_path: Some(disk_path),
            signal_sender,
        }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<BlackboardSignal> {
        self.signal_sender.subscribe()
    }

    /// Zero-Trust Author Write Isolation:
    /// An agent can ONLY write to their own namespace `blackboard://{ws}/{team}/{agent}/...`.
    pub async fn publish(&self, caller_agent_id: &str, artifact: BlackboardArtifact) -> Result<BlackboardSignal, BlackboardError> {
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
