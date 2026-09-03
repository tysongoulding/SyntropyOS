use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolApprovalRequest {
    pub request_id: String,
    pub agent_id: String,
    pub tool_name: String,
    pub parameters: serde_json::Value,
    pub rationale: String,
}

/// Deterministic Security Filter:
/// Scans manifests and removes all destructive tools before exposing to LLMs.
pub struct SecurityFilter {
    pub forbidden_patterns: Vec<String>,
}

impl Default for SecurityFilter {
    fn default() -> Self {
        Self {
            forbidden_patterns: vec![
                "delete_message".to_string(),
                "trash_message".to_string(),
                "purge".to_string(),
                "drop_table".to_string(),
                "rm".to_string(),
                "format_disk".to_string(),
                "truncate".to_string(),
            ],
        }
    }
}

impl SecurityFilter {
    pub fn new(forbidden: Vec<String>) -> Self {
        Self {
            forbidden_patterns: forbidden,
        }
    }

    pub fn is_allowed(&self, tool_name: &str) -> bool {
        let lower = tool_name.to_lowercase();
        !self.forbidden_patterns.iter().any(|pattern| lower.contains(pattern))
    }

    pub fn filter_tools(&self, tools: Vec<ToolDefinition>) -> Vec<ToolDefinition> {
        tools
            .into_iter()
            .filter(|t| self.is_allowed(&t.name))
            .collect()
    }
}

// Native Rig Tool: ReadFileTool
#[derive(Debug, Deserialize, JsonSchema)]
pub struct ReadFileArgs {
    pub path: String,
}

#[derive(Debug, Serialize)]
pub struct ReadFileOutput {
    pub content: String,
    pub size_bytes: usize,
}

// MCP Connector abstraction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerConfig {
    pub server_id: String,
    pub command: String,
    pub args: Vec<String>,
    pub env: std::collections::HashMap<String, String>,
}

pub struct McpConnector {
    pub servers: Vec<McpServerConfig>,
}

impl McpConnector {
    pub fn new() -> Self {
        Self { servers: Vec::new() }
    }

    pub fn register_server(&mut self, config: McpServerConfig) {
        self.servers.retain(|s| s.server_id != config.server_id);
        self.servers.push(config);
    }
}

impl Default for McpConnector {
    fn default() -> Self {
        Self::new()
    }
}
