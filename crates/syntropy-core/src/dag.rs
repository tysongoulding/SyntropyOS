use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use thiserror::Error;

#[derive(Error, Debug, PartialEq, Eq)]
pub enum DagError {
    #[error("Task not found: {0}")]
    TaskNotFound(String),

    #[error("Cycle detected in Workstream DAG dependencies")]
    CycleDetected,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    Ready,
    Running,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskNode {
    pub id: String,
    pub title: String,
    pub agent_id: String,
    pub status: TaskStatus,
    pub input_uris: Vec<String>,
    pub output_uris: Vec<String>,
}

impl TaskNode {
    pub fn new(id: &str, title: &str, agent_id: &str) -> Self {
        Self {
            id: id.to_string(),
            title: title.to_string(),
            agent_id: agent_id.to_string(),
            status: TaskStatus::Pending,
            input_uris: Vec::new(),
            output_uris: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkstreamDag {
    pub id: String,
    pub nodes: HashMap<String, TaskNode>,
    // node_id -> set of dependencies that must finish first
    pub dependencies: HashMap<String, HashSet<String>>,
}

impl WorkstreamDag {
    pub fn new(id: &str) -> Self {
        Self {
            id: id.to_string(),
            nodes: HashMap::new(),
            dependencies: HashMap::new(),
        }
    }

    pub fn add_node(&mut self, node: TaskNode) {
        self.dependencies.entry(node.id.clone()).or_default();
        self.nodes.insert(node.id.clone(), node);
    }

    pub fn add_dependency(&mut self, task_id: &str, depends_on_id: &str) -> Result<(), DagError> {
        if !self.nodes.contains_key(task_id) {
            return Err(DagError::TaskNotFound(task_id.to_string()));
        }
        if !self.nodes.contains_key(depends_on_id) {
            return Err(DagError::TaskNotFound(depends_on_id.to_string()));
        }

        self.dependencies
            .entry(task_id.to_string())
            .or_default()
            .insert(depends_on_id.to_string());

        Ok(())
    }

    /// Kahn's algorithm for topological sorting and cycle detection
    pub fn topological_sort(&self) -> Result<Vec<String>, DagError> {
        let mut in_degree: HashMap<String, usize> = HashMap::new();
        let mut dependents: HashMap<String, Vec<String>> = HashMap::new();

        for node_id in self.nodes.keys() {
            in_degree.insert(node_id.clone(), 0);
            dependents.insert(node_id.clone(), Vec::new());
        }

        for (node_id, deps) in &self.dependencies {
            in_degree.insert(node_id.clone(), deps.len());
            for dep in deps {
                dependents.entry(dep.clone()).or_default().push(node_id.clone());
            }
        }

        let mut queue: VecDeque<String> = in_degree
            .iter()
            .filter(|(_, &deg)| deg == 0)
            .map(|(id, _)| id.clone())
            .collect();

        let mut order = Vec::new();

        while let Some(node_id) = queue.pop_front() {
            order.push(node_id.clone());

            if let Some(downstream) = dependents.get(&node_id) {
                for next_id in downstream {
                    if let Some(deg) = in_degree.get_mut(next_id) {
                        *deg -= 1;
                        if *deg == 0 {
                            queue.push_back(next_id.clone());
                        }
                    }
                }
            }
        }

        if order.len() != self.nodes.len() {
            return Err(DagError::CycleDetected);
        }

        Ok(order)
    }

    pub fn get_ready_tasks(&self, completed_tasks: &HashSet<String>) -> Vec<String> {
        let mut ready = Vec::new();
        for (node_id, node) in &self.nodes {
            if node.status != TaskStatus::Pending {
                continue;
            }
            let deps = self.dependencies.get(node_id);
            let all_met = match deps {
                Some(deps) => deps.iter().all(|d| completed_tasks.contains(d)),
                None => true,
            };
            if all_met {
                ready.push(node_id.clone());
            }
        }
        ready
    }
}
