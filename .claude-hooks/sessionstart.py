#!/usr/bin/env python3
"""
SessionStart Hook - Provides context recovery after compaction
Automatically injects saved context when session starts after compaction
"""

import json
import sys
import os
from datetime import datetime

def load_checkpoint():
    """Load the most recent pre-compaction checkpoint"""
    checkpoint_path = ".claude/state/pre-compaction-checkpoint.json"
    if os.path.exists(checkpoint_path):
        try:
            with open(checkpoint_path, "r") as f:
                return json.load(f)
        except:
            return None
    return None

def create_recovery_context(checkpoint):
    """Create context injection for post-compaction recovery"""
    if not checkpoint:
        return """
🔄 SESSION STARTED - No previous context checkpoint found.

This appears to be a fresh session. Current project: Knowledge Engineering POC for L'Oréal Design Authority.
"""

    timestamp = checkpoint.get('timestamp', 'Unknown time')

    context = f"""
🔄 POST-COMPACTION RECOVERY ACTIVE

## Context Restored from {timestamp}

### Project: Knowledge Engineering POC for L'Oréal Design Authority
- Document Processed: {checkpoint['user_context']['document_processed']}
- User: {checkpoint['user_context']['github']}
- Tools Available: {checkpoint['user_context']['tools']}

### Critical Architectural Decisions (ESTABLISHED - DO NOT CHANGE)
"""

    for decision in checkpoint['critical_decisions']:
        context += f"- {decision}\n"

    context += f"""
### Development Context at Compaction
- Git Status: {checkpoint['git_status'] or 'Clean working directory'}
- Recent Commits:
{checkpoint['git_commits']}

### Active Issues to Continue
"""

    if checkpoint['active_issues']:
        for issue in checkpoint['active_issues']:
            if issue.strip():
                context += f"- {issue.strip()}\n"
    else:
        context += "- No active issues recorded\n"

    context += f"""
### User Preferences (IMPORTANT)
- {checkpoint['user_context']['preferences']}

### Next Steps
1. Verify this context matches your current understanding
2. Continue with established priorities and architectural decisions
3. Do NOT re-suggest approaches we've already decided against

📁 Full checkpoint available at: .claude/state/pre-compaction-checkpoint.json

❓ VERIFICATION NEEDED: Does this restored context align with where we left off?
"""

    return context

def main():
    try:
        # Load hook input
        input_data = json.load(sys.stdin)

        source = input_data.get("source", "")
        session_id = input_data.get("session_id", "unknown")

        # Log session start
        with open(".claude/state/compaction.log", "a") as f:
            f.write(f"\n[{datetime.now().isoformat()}] SESSION-START: source={source}, session={session_id}\n")

        # If this is a post-compaction session, inject recovery context
        if source == "compact":
            checkpoint = load_checkpoint()
            recovery_context = create_recovery_context(checkpoint)

            # Use JSON output to inject context
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": recovery_context
                }
            }

            print(json.dumps(output))

            # Also log the recovery
            with open(".claude/state/compaction.log", "a") as f:
                f.write(f"[{datetime.now().isoformat()}] RECOVERY: Context injected from checkpoint\n")
        else:
            # Regular session start - just add basic project context
            basic_context = """
🚀 Knowledge Engineering POC Session Started

Project: L'Oréal Design Authority Knowledge Extraction
Repository: knowledge-engineering (local development)
Context continuity system: Active with hook-based state management

Ready to continue development. Check CLAUDE.md for current project status.
"""

            output = {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": basic_context
                }
            }

            print(json.dumps(output))

    except Exception as e:
        # Don't fail silently - log the error but don't block session start
        with open(".claude/state/compaction.log", "a") as f:
            f.write(f"[{datetime.now().isoformat()}] ERROR in SessionStart hook: {e}\n")

        # Return minimal context on error
        output = {
            "hookSpecificOutput": {
                "hookEventName": "SessionStart",
                "additionalContext": "⚠️ Context recovery hook encountered an error. Check .claude/state/compaction.log for details."
            }
        }
        print(json.dumps(output))

if __name__ == "__main__":
    main()