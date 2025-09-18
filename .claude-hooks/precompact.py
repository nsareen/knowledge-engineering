#!/usr/bin/env python3
"""
PreCompact Hook - Saves critical context before compaction occurs
Captures architectural decisions, active debugging state, and user preferences
"""

import json
import sys
import os
import subprocess
from datetime import datetime
from pathlib import Path

def get_git_context():
    """Get recent git commits and current status"""
    try:
        # Get recent commits
        recent_commits = subprocess.run(
            ["git", "log", "--oneline", "-5"],
            capture_output=True, text=True
        ).stdout.strip()

        # Get current status
        git_status = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True, text=True
        ).stdout.strip()

        return recent_commits, git_status
    except:
        return "No git history available", "No git status"

def read_claude_md():
    """Read current CLAUDE.md for project context"""
    try:
        with open("CLAUDE.md", "r") as f:
            content = f.read()
        return content[:2000] + "..." if len(content) > 2000 else content
    except:
        return "CLAUDE.md not found"

def get_active_issues():
    """Get current debugging and development context"""
    issues = []

    # Check if there are any active backend processes
    try:
        result = subprocess.run(
            ["lsof", "-i", ":3001"],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            issues.append("Backend server running on port 3001")
    except:
        pass

    # Check for any error logs or known issues
    if os.path.exists(".claude/active-issues.log"):
        try:
            with open(".claude/active-issues.log", "r") as f:
                issues.extend(f.readlines())
        except:
            pass

    return issues

def save_context_checkpoint():
    """Save comprehensive context to checkpoint file"""
    context = {
        "timestamp": datetime.now().isoformat(),
        "git_commits": get_git_context()[0],
        "git_status": get_git_context()[1],
        "claude_md_excerpt": read_claude_md(),
        "active_issues": get_active_issues(),
        "critical_decisions": [
            "Use neo4jDriver.int() for all Neo4j LIMIT parameters - prevents '10.0' vs '10' errors",
            "Multi-agent validation approach agreed: Independent Content Analysis + 3 validation agents",
            "Unified Neo4j graph architecture - not separate databases",
            "Image-first PDF processing with GPT-4o model",
            "L'Oréal Design Authority focus - DA_Template_small.pdf processed successfully"
        ],
        "user_context": {
            "github": "https://github.com/nsareen",
            "tools": "Has Notion, NO Jira/Confluence",
            "preferences": "No code comments unless requested, prefer editing existing files",
            "document_processed": "DA_Template_small.pdf - 14 concepts, 25 entities, 19 relationships"
        }
    }

    # Save to checkpoint file
    os.makedirs(".claude/state", exist_ok=True)
    with open(".claude/state/pre-compaction-checkpoint.json", "w") as f:
        json.dump(context, f, indent=2)

    return context

def main():
    try:
        # Load hook input
        input_data = json.load(sys.stdin)

        # Save context checkpoint
        context = save_context_checkpoint()

        # Create context summary for injection
        context_summary = f"""🚨 PRE-COMPACTION CONTEXT SNAPSHOT

## Project: Knowledge Engineering POC for L'Oréal Design Authority
- Successfully processed DA_Template_small.pdf: {context['user_context']['document_processed']}
- User: {context['user_context']['github']}, {context['user_context']['tools']}

## Critical Architectural Decisions (DO NOT CHANGE)
{chr(10).join(f"- {decision}" for decision in context['critical_decisions'])}

## Current Development Context
- Git Status: {context['git_status'] or 'Clean working directory'}
- Recent Work: {context['git_commits'].split(chr(10))[0] if context['git_commits'] else 'No recent commits'}

## Active Issues to Continue
{chr(10).join(f"- {issue.strip()}" for issue in context['active_issues'] if issue.strip())}

## User Preferences
- {context['user_context']['preferences']}

⚠️ IMPORTANT: Read .claude/state/pre-compaction-checkpoint.json for full context after compaction
VERIFY WITH USER: Does this context match your current understanding?
"""

        # Create log entry
        with open(".claude/state/compaction.log", "a") as f:
            f.write(f"\n[{context['timestamp']}] PRE-COMPACTION: Context saved\n")

        print(f"✅ Context checkpoint saved at {context['timestamp']}")

    except Exception as e:
        print(f"❌ Error in PreCompact hook: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()