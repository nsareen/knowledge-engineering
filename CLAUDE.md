# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Project Setup
```bash
npm install                    # Install dependencies for all workspaces
npm run build:shared          # Build shared types package (required first)
```

### Development Mode
```bash
npm run dev                    # Run both backend (3001) and frontend (5173) concurrently
npm run dev:backend           # Backend only at http://localhost:3001
npm run dev:frontend          # Frontend only at http://localhost:5173
```

### Individual Workspace Commands
```bash
cd backend && npm run dev     # Backend with tsx watch mode
cd frontend && npm run dev    # Frontend with Vite dev server
cd shared && npm run build    # Compile shared TypeScript types
```

### Production Build
```bash
npm run build                 # Build all workspaces in dependency order
```

## Architecture Overview

This is a knowledge engineering POC that builds knowledge graphs from unstructured documents using multimodal LLM analysis. The system follows a **unified Neo4j graph architecture** combining both knowledge and content in a single database.

### Core Architecture Patterns

**Unified Graph Database Approach:**
- **Subject Graph**: Concepts, entities, relationships extracted from content  
- **Lexical Graph**: Documents, pages, images, summaries from original files
- **Cross-Graph Correlations**: Connected via `EXTRACTED_FROM`, `CITES`, `CORRELATES_WITH` relationships

**Multi-Agent Knowledge Extraction:**
- `ConceptExtractionAgent`: Extracts domain concepts with confidence scoring
- `EntityRecognitionAgent`: Identifies entities and their attributes  
- `RelationshipMappingAgent`: Maps relationships between concepts/entities
- `WorkflowOrchestrator`: Coordinates sequential/parallel agent execution with audit trails

**Image-First Document Processing:**
- PDF pages → high-resolution images → GPT-4 Vision analysis
- Three-tier content strategy: structured knowledge + summaries + visual fallback
- PPTX processing is placeholder (returns empty pages)

### Key Services and Data Flow

**DocumentProcessorService** (`backend/src/services/document-processor.ts`):
- Converts PDF pages to images using `pdf2pic` and `sharp`
- Processes each page through GPT-4 Vision with configurable prompts
- Integrates with `KnowledgeGraphConstructor` for knowledge extraction

**KnowledgeGraphConstructor** (`backend/src/services/knowledge-graph-constructor.ts`):
- Orchestrates multi-agent workflow for knowledge extraction
- Handles deduplication and confidence-based merging
- Creates cross-graph correlations linking knowledge to source content

**Neo4jService** (`backend/src/services/neo4j.ts`):
- Manages Neo4j Aura connection with automatic schema initialization
- Handles both subject graph (knowledge) and lexical graph (content) operations
- Uses parameterized queries with proper integer handling for LIMIT clauses

### Frontend Architecture

**React + TypeScript + Tailwind CSS:**
- `pages/Documents.tsx`: Drag-and-drop upload with domain/metamodel configuration
- `pages/GraphView.tsx`: Knowledge graph visualization with filtering
- `pages/Dashboard.tsx`: Real-time statistics from graph API
- `services/api.ts`: Typed API client with axios interceptors

### Environment Configuration

Required `.env` variables:
```bash
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j  
NEO4J_PASSWORD=your-password
OPENAI_API_KEY=your-openai-api-key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### API Endpoint Patterns

All endpoints follow `/api/*` pattern:
- `POST /api/documents/upload`: Multipart form with optional domain/metamodel/extractionPrompt
- `GET /api/graph`: Query parameters for nodeTypes, limit (integer), documentId filtering
- `GET /api/graph/stats`: Node counts by type and relationship statistics
- `GET /api/documents`: List with extraction statistics from graph queries

### Common Development Issues

**Neo4j Parameter Handling:**
- Use `options.domain || null` pattern for optional parameters in document creation
- Ensure `parseInt()` results are wrapped with `Math.floor()` for LIMIT clauses
- Domain parameter comes from processing options, not document properties

**Multi-Agent Workflow Integration:**
- Knowledge extraction happens in `saveToGraph()` after document processing
- Workflow orchestrator provides complete audit trails of extraction steps
- Deduplication occurs at the knowledge graph constructor level

**Document Upload Flow:**
- Use dedicated Documents page (`/documents`) for uploads, not dashboard buttons
- PDF processing works fully; PPTX is placeholder returning empty pages
- Check browser console and backend logs for processing errors

### Shared Types

The `shared` workspace contains TypeScript definitions for:
- Graph node types: `ConceptNode`, `EntityNode`, `DocumentNode`, `PageNode`
- API request/response types: `DocumentUploadResponse`, `SearchRequest`
- Agent execution types: `WorkflowExecution`, `AgentStep`

Build shared types before other workspaces: `npm run build:shared`

### Testing Document Processing

Upload PDF documents through http://localhost:5173/documents (or 5174 if port conflict). Processing involves:
1. PDF → images → GPT-4 Vision analysis
2. Multi-agent knowledge extraction  
3. Neo4j graph storage with cross-correlations
4. Real-time statistics updates on Dashboard and GraphView

Check backend console for processing logs and any Neo4j/OpenAI errors.