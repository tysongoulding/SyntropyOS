use syntropy_engine::tools::{SecurityFilter, ToolDefinition};

#[test]
fn test_security_filter_strips_destructive() {
    let filter = SecurityFilter::default();

    let tools = vec![
        ToolDefinition {
            name: "read_file".to_string(),
            description: "Read contents of a file safely".to_string(),
            parameters: serde_json::json!({}),
        },
        ToolDefinition {
            name: "delete_message".to_string(),
            description: "Delete an email message".to_string(),
            parameters: serde_json::json!({}),
        },
        ToolDefinition {
            name: "trash_message".to_string(),
            description: "Move message to trash".to_string(),
            parameters: serde_json::json!({}),
        },
        ToolDefinition {
            name: "drop_table".to_string(),
            description: "Drop a database table".to_string(),
            parameters: serde_json::json!({}),
        },
        ToolDefinition {
            name: "purge_cache".to_string(),
            description: "Purge system cache".to_string(),
            parameters: serde_json::json!({}),
        },
        ToolDefinition {
            name: "summarize_document".to_string(),
            description: "Generate a markdown summary".to_string(),
            parameters: serde_json::json!({}),
        },
    ];

    let filtered = filter.filter_tools(tools);
    let allowed_names: Vec<String> = filtered.into_iter().map(|t| t.name).collect();

    assert_eq!(allowed_names, vec!["read_file", "summarize_document"]);
    assert!(!allowed_names.contains(&"delete_message".to_string()));
    assert!(!allowed_names.contains(&"trash_message".to_string()));
    assert!(!allowed_names.contains(&"drop_table".to_string()));
    assert!(!allowed_names.contains(&"purge_cache".to_string()));
}
