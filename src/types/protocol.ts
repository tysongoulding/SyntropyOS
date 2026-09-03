// SyntropyOS IPC Protocol Types
// Must match field-for-field with src-tauri/src/protocol.rs in snake_case

export interface ActionItem {
  id: string;
  description: string;
  assigned_agent_id: string;
  priority: string;
}

export interface RiskEvaluation {
  risk: string;
  severity: string;
  mitigation: string;
}

export interface TeamPlan {
  workstream_id: string;
  team_id: string;
  title: string;
  executive_summary: string;
  action_items: ActionItem[];
  target_files: string[];
  execution_order: string[];
  identified_risks: RiskEvaluation[];
}

export interface ToolApprovalRequest {
  request_id: string;
  agent_id: string;
  tool_name: string;
  parameters: Record<string, unknown>;
  rationale: string;
}

export interface BlackboardArtifact {
  uri: string;
  author_id: string;
  title: string;
  content: string;
  mime_type: string;
  version: number;
  hash: string;
  created_at: string;
}

export type WorkstreamCommand =
  | {
      command: "launch_workstream";
      blueprint_id: string;
      workstream_name: string;
      params: Record<string, unknown>;
    }
  | {
      command: "pause_workstream";
      workstream_id: string;
    }
  | {
      command: "approve_milestone";
      workstream_id: string;
      milestone_id: string;
    }
  | {
      command: "read_blackboard";
      uri: string;
    }
  | {
      command: "save_api_key";
      provider: string;
      key: string;
    }
  | {
      command: "get_system_status";
    }
  | {
      command: "calibrate_fta";
      workstream_id: string;
      rating: number;
      hours_saved: number;
    };

export type WorkstreamEvent =
  | {
      event: "sme_task_started";
      task_id: string;
      agent_id: string;
      role: string;
      phase: string;
    }
  | {
      event: "artifact_published";
      uri: string;
      title: string;
      author: string;
      version: number;
      size_bytes: number;
    }
  | {
      event: "team_plan_synthesized";
      workstream_id: string;
      plan: TeamPlan;
    }
  | {
      event: "tool_approval_request";
      request_id: string;
      agent_id: string;
      tool_name: string;
      parameters: Record<string, unknown>;
      rationale: string;
    }
  | {
      event: "workstream_completed";
      workstream_id: string;
      total_hours_saved: number;
    }
  | {
      event: "token_stream";
      task_id: string;
      agent_id: string;
      chunk: string;
    };

export interface SystemStatus {
  version: string;
  os: string;
  app_data_dir: string;
  extensions_dir: string;
  connected_providers: string[];
  active_workstreams_count: number;
  total_labor_hours_saved: number;
}
