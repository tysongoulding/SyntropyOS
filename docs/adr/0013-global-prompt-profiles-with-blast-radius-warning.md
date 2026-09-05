# 13. Global Prompt Profiles with Explicit Blast-Radius Warning

## Context
Developers and department managers want customized agent personas and directives to apply consistently across all their projects without copy-pasting prompt overrides into each new workspace. However, global modifications risk inadvertently altering agent behavior across unrelated workstreams.

## Decision
All custom prompt edits in the Rules tab are saved to a centralized Global Prompt Profile in user AppData (`AppPaths::custom_prompts_dir`). When switching from Default to Custom mode, an explicit modal dialog warns the user that this change modifies the agent's behavior across all workstreams, offering a one-click "Return to Default" button at any time.

## Consequences
Custom agent behaviors follow the developer everywhere on their machine with a single source of truth, while the warning modal prevents accidental unintended drift.
