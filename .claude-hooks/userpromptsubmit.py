#!/usr/bin/env python3
"""
UserPromptSubmit Hook - Detects context drift and provides warnings
Prevents re-suggesting rejected approaches and maintains architectural consistency
"""

import json
import sys
import re
from datetime import datetime

# Context drift patterns that indicate I may have lost context
DRIFT_PATTERNS = [
    (r"(?i)let.*start.*from.*beginning", "Suggests starting over - possible context loss detected"),
    (r"(?i)create.*new.*repo", "Already established: working in existing knowledge-engineering repo"),
    (r"(?i)should.*use.*jira|confluence", "ESTABLISHED: User has Notion only, NO Jira/Confluence"),
    (r"(?i)parseInt|parseFloat", "ESTABLISHED: Use neo4jDriver.int() for Neo4j parameters"),
    (r"(?i)separate.*database|multiple.*neo4j", "ESTABLISHED: Unified Neo4j graph architecture"),
    (r"(?i)example\.pdf", "ESTABLISHED: Using DA_Template_small.pdf now, example.pdf was cleared"),
    (r"(?i)gpt-4-vision", "ESTABLISHED: Upgraded to gpt-4o model"),
    (r"(?i)add.*comment", "USER PREFERENCE: No code comments unless explicitly requested"),
    (r"(?i)create.*new.*file.*(?:md|readme)", "USER PREFERENCE: Prefer editing existing files"),
    (r"(?i)metamodel.*required", "ESTABLISHED: Multi-agent validation works without metamodel"),
]

# Critical project context reminders
PROJECT_CONTEXT = {
    "user_profile": "GitHub: nsareen, Has Notion (NO Jira/Confluence)",
    "document_status": "DA_Template_small.pdf processed: 14 concepts, 25 entities, 19 relationships",
    "architecture": "Unified Neo4j graph, Multi-agent validation, Image-first PDF processing",
    "current_focus": "Fix remaining Neo4j LIMIT parameter issues, Add validation agents",
    "established_decisions": [
        "Use neo4jDriver.int() for all Neo4j numeric parameters",
        "Multi-agent validation approach (no metamodel required)",
        "Unified Neo4j graph (not separate databases)",
        "GPT-4o model for image analysis",
        "L'Oréal Design Authority domain focus"
    ]
}

def detect_context_drift(prompt):
    """Detect patterns that suggest context loss or drift"""
    detected_issues = []

    for pattern, warning in DRIFT_PATTERNS:
        if re.search(pattern, prompt):
            detected_issues.append(warning)

    return detected_issues

def create_context_reminder(drift_issues):
    """Create context reminder based on detected drift"""
    reminder = "⚠️ CONTEXT DRIFT DETECTED\n\n"

    if drift_issues:
        reminder += "Potential issues detected:\n"
        for issue in drift_issues:
            reminder += f"- {issue}\n"
        reminder += "\n"

    reminder += f"""CRITICAL PROJECT CONTEXT REMINDER:

## Project: Knowledge Engineering POC for L'Oréal Design Authority
- User: {PROJECT_CONTEXT['user_profile']}
- Status: {PROJECT_CONTEXT['document_status']}
- Architecture: {PROJECT_CONTEXT['architecture']}
- Current Focus: {PROJECT_CONTEXT['current_focus']}

## Established Architectural Decisions (DO NOT RE-SUGGEST)
"""

    for decision in PROJECT_CONTEXT['established_decisions']:
        reminder += f"- {decision}\n"

    reminder += """
## Recent Development Context
- Successfully processed user's actual DA document (not example.pdf)
- Knowledge extraction working: multi-agent workflow active
- Current issue: Some Neo4j LIMIT parameters still showing as '10.0' instead of '10'
- Hook-based context continuity system now active

Please proceed with your request, but ensure it aligns with these established decisions and preferences.
"""

    return reminder

def log_prompt_analysis(prompt, drift_detected):
    """Log prompt analysis for debugging"""
    try:
        with open(".claude/state/prompt-analysis.log", "a") as f:
            f.write(f"\n[{datetime.now().isoformat()}] PROMPT ANALYSIS\n")
            f.write(f"Drift detected: {len(drift_detected) > 0}\n")
            if drift_detected:
                f.write(f"Issues: {', '.join(drift_detected)}\n")
            f.write(f"Prompt preview: {prompt[:100]}...\n")
    except:
        pass  # Don't fail on logging errors

def main():
    try:
        # Load hook input
        input_data = json.load(sys.stdin)
        prompt = input_data.get("prompt", "")

        # Detect context drift
        drift_issues = detect_context_drift(prompt)

        # Log analysis
        log_prompt_analysis(prompt, drift_issues)

        # If context drift detected, inject warning
        if drift_issues:
            context_reminder = create_context_reminder(drift_issues)

            output = {
                "hookSpecificOutput": {
                    "hookEventName": "UserPromptSubmit",
                    "additionalContext": context_reminder
                }
            }

            print(json.dumps(output))

            # Log the intervention
            with open(".claude/state/compaction.log", "a") as f:
                f.write(f"[{datetime.now().isoformat()}] DRIFT-DETECTION: Injected context reminder\n")

        # Allow prompt to proceed (no blocking)
        sys.exit(0)

    except Exception as e:
        # Log error but don't block the prompt
        try:
            with open(".claude/state/compaction.log", "a") as f:
                f.write(f"[{datetime.now().isoformat()}] ERROR in UserPromptSubmit hook: {e}\n")
        except:
            pass

        # Don't block the user's prompt on hook errors
        sys.exit(0)

if __name__ == "__main__":
    main()