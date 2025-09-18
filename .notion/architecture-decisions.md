# Architecture Decision Records Template

Copy this template to create a new ADR page in Notion.

## Database Properties
Create a Notion database with these properties:
- **Title**: Title (text)
- **Status**: Select (Proposed, Accepted, Deprecated, Superseded)
- **Date**: Date
- **Context**: Text
- **Decision**: Text
- **Consequences**: Text
- **GitHub Issues**: URL (links to related GitHub issues)
- **Tags**: Multi-select (Architecture, Security, Performance, UI/UX, Database)

---

# ADR-001: [Decision Title]

**Status**: Proposed | Accepted | Deprecated | Superseded
**Date**: YYYY-MM-DD
**GitHub Issues**: [Link to relevant GitHub issues]

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?

### Positive Consequences
- Benefit 1
- Benefit 2
- Benefit 3

### Negative Consequences
- Risk 1
- Risk 2
- Risk 3

### Neutral Consequences
- Impact 1
- Impact 2

## Implementation Notes
Technical details about how this decision will be implemented.

## Alternatives Considered
What other options were evaluated?

### Alternative 1: [Name]
- **Pros**:
- **Cons**:
- **Why rejected**:

### Alternative 2: [Name]
- **Pros**:
- **Cons**:
- **Why rejected**:

## Related Decisions
Links to other ADRs that are related to this decision.

## References
- External documentation
- Research papers
- Industry best practices
- Team discussions

---

## Example ADRs for Knowledge Engineering POC

### ADR-001: Unified Neo4j Graph Architecture
**Status**: Accepted
**Context**: Need to store both extracted knowledge and source document structure
**Decision**: Use single Neo4j database with subject graph (concepts/entities) and lexical graph (documents/pages)
**GitHub Issues**: #1

### ADR-002: Multi-Agent Validation Approach
**Status**: Accepted
**Context**: Need quality assurance for knowledge extraction accuracy
**Decision**: Implement independent validation agents rather than metamodel-based validation
**GitHub Issues**: #1, #3

### ADR-003: Context Continuity Hook System
**Status**: Accepted
**Context**: Claude Code sessions lose context across compaction events
**Decision**: Implement PreCompact, SessionStart, and UserPromptSubmit hooks for state preservation
**GitHub Issues**: N/A (completed)