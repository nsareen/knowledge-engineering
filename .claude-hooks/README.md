# Claude Code Context Continuity Hooks

This directory contains hooks for maintaining context continuity across compaction events and detecting context drift.

## Hook Files

### `precompact.py` - Context Preservation
- **Trigger**: Before compaction occurs (auto or manual)
- **Purpose**: Saves comprehensive project context to checkpoint files
- **Output**: JSON checkpoint with architectural decisions, debugging state, user preferences
- **Location**: `.claude/state/pre-compaction-checkpoint.json`

### `sessionstart.py` - Context Recovery
- **Trigger**: Session start, especially after compaction
- **Purpose**: Automatically injects saved context into new session
- **Behavior**: Detects post-compaction sessions and loads checkpoint data
- **Output**: Context injection with verification prompt for user

### `userpromptsubmit.py` - Context Drift Detection
- **Trigger**: Before each user prompt is processed
- **Purpose**: Detects patterns suggesting context loss or architectural drift
- **Behavior**: Warns when prompts suggest rejected approaches or forgotten decisions
- **Output**: Context reminders when drift patterns detected

## Configuration

To activate these hooks, you need to configure Claude Code settings. The hooks should be configured with these matchers:

```json
{
  "hooks": {
    "PreCompact": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/.claude-hooks/precompact.py"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/.claude-hooks/sessionstart.py"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/.claude-hooks/userpromptsubmit.py"
          }
        ]
      }
    ]
  }
}
```

## State Management

### Directory Structure
```
.claude/
├── state/
│   ├── pre-compaction-checkpoint.json  # Full context snapshot
│   ├── compaction.log                 # Hook execution log
│   └── prompt-analysis.log            # Context drift detection log
└── hooks/
    ├── precompact.py                  # Context preservation
    ├── sessionstart.py               # Context recovery
    └── userpromptsubmit.py           # Drift detection
```

### Context Checkpoint Format
```json
{
  "timestamp": "2025-09-18T...",
  "git_commits": "Recent commit history",
  "git_status": "Working directory status",
  "claude_md_excerpt": "Project context from CLAUDE.md",
  "active_issues": ["Current debugging context"],
  "critical_decisions": ["Architectural choices"],
  "user_context": {
    "github": "User's GitHub profile",
    "tools": "Available tools and preferences",
    "preferences": "Development preferences",
    "document_processed": "Current document status"
  }
}
```

## Context Drift Patterns

The system detects these patterns that indicate context loss:

- Starting over suggestions (`"let's start from the beginning"`)
- Creating new repositories (already established)
- Suggesting Jira/Confluence (user only has Notion)
- Using deprecated approaches (parseInt vs neo4jDriver.int)
- Forgetting architectural decisions (separate databases vs unified)
- Suggesting rejected tools or approaches

## Usage

### Manual Testing
```bash
# Test PreCompact hook
echo '{"hook_event_name": "PreCompact", "trigger": "manual"}' | .claude-hooks/precompact.py

# Test SessionStart hook
echo '{"hook_event_name": "SessionStart", "source": "compact"}' | .claude-hooks/sessionstart.py

# Test context drift detection
echo '{"prompt": "should we use jira for this project?"}' | .claude-hooks/userpromptsubmit.py
```

### Monitoring
```bash
# Check hook execution logs
tail -f .claude/state/compaction.log

# Review context drift detection
tail -f .claude/state/prompt-analysis.log

# View last checkpoint
cat .claude/state/pre-compaction-checkpoint.json | jq
```

## Benefits

1. **Zero Context Loss**: Automatic recovery after compaction
2. **Architecture Consistency**: Prevents re-suggesting rejected approaches
3. **Development Continuity**: Maintains debugging context and priorities
4. **User Preference Preservation**: Remembers specific requirements and constraints
5. **Proactive Drift Detection**: Warns before context issues occur

## Troubleshooting

- **Hooks not executing**: Check Claude Code configuration and file permissions
- **Context not restored**: Verify checkpoint file exists and is readable
- **False drift detection**: Review patterns in `userpromptsubmit.py`
- **Permission errors**: Ensure all `.py` files are executable (`chmod +x`)