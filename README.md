# Knowledge Engineering POC

A proof-of-concept system for building knowledge graphs from unstructured documents using multimodal LLM analysis.

## Features

- **Document Processing**: Upload PDF and PowerPoint files for analysis
- **Multimodal Extraction**: Use GPT-4 Vision to analyze document pages as images
- **Knowledge Graph**: Store concepts, entities, and relationships in Neo4j
- **Hybrid Search**: Query both structured knowledge and document content
- **Interactive Chat**: Ask questions about your documents with citations
- **Graph Visualization**: Explore knowledge connections visually

## Architecture

### Unified Graph Database Approach

- **Subject Graph**: Concepts, entities, relationships, attributes
- **Lexical Graph**: Documents, pages, summaries, images, annotations
- **Cross-Graph Correlations**: Connected via relationship types (EXTRACTED_FROM, CITES, etc.)

### Technology Stack

- **Backend**: TypeScript, Node.js, Express
- **Database**: Neo4j Aura (unified graph storage)
- **AI**: OpenAI GPT-4 Vision and text models
- **Frontend**: React, TypeScript, Tailwind CSS, Cytoscape.js
- **Build**: Vite, npm workspaces

## Setup Instructions

### Prerequisites

1. **Neo4j Aura Account**: Get credentials for a Neo4j Aura instance
2. **OpenAI API Key**: Get an API key with GPT-4 access
3. **Node.js**: Version 18 or higher

### Installation

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd knowledge-engineering
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials:
   # - NEO4J_URI=your-neo4j-aura-uri
   # - NEO4J_PASSWORD=your-neo4j-password
   # - OPENAI_API_KEY=your-openai-api-key
   ```

3. **Build Shared Package**:
   ```bash
   npm run build:shared
   ```

### Running the Application

1. **Development Mode** (runs both backend and frontend):
   ```bash
   npm run dev
   ```

2. **Individual Services**:
   ```bash
   # Backend only (http://localhost:3001)
   npm run dev:backend
   
   # Frontend only (http://localhost:5173)
   npm run dev:frontend
   ```

3. **Production Build**:
   ```bash
   npm run build
   ```

### Access Points

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Usage

### 1. Upload Documents
- Navigate to Documents page
- Upload PDF or PowerPoint files (max 50MB)
- System converts pages to images and analyzes with GPT-4 Vision

### 2. View Knowledge Graph
- Go to Knowledge Graph page
- Explore extracted concepts, entities, and relationships
- Use filters and visualization controls

### 3. Search Content
- Use Search page for hybrid queries
- Search types: concept, content, semantic, hybrid
- Results show citations back to source documents

### 4. Interactive Chat
- Chat page for natural language Q&A
- Ask questions about your documents
- Responses include reasoning steps and citations

## API Endpoints

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id/status` - Get processing status
- `GET /api/documents/:id/pages` - Get document pages
- `GET /api/documents` - List all documents

### Search
- `POST /api/search` - Search knowledge and content
- `GET /api/search/concepts/:id/similar` - Find similar concepts

### Q&A
- `POST /api/qa` - Ask questions
- `GET /api/qa/history` - Get conversation history

### Graph
- `GET /api/graph` - Get graph structure
- `GET /api/graph/nodes/:id` - Get node with connections
- `GET /api/graph/path/:start/:end` - Find path between nodes

## Project Structure

```
knowledge-engineering/
├── backend/          # Express API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Neo4j, OpenAI services
│   │   ├── agents/   # Multi-agent workflow (TODO)
│   │   └── utils/    # Utility functions
├── frontend/         # React application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/     # Main pages
│   │   ├── services/  # API clients
│   │   └── hooks/     # React hooks
├── shared/           # Shared TypeScript types
│   └── src/types.ts  # Common interfaces
└── requirements/     # Original requirements
```

## Development Status

### ✅ Completed
- Project structure and build system
- TypeScript configuration
- Basic Express server with routes
- Neo4j connection and schema initialization
- OpenAI service integration
- React frontend with routing
- Shared type definitions

### 🚧 Next Steps
1. Document processing pipeline (PDF/PPTX to images)
2. Multi-agent workflow implementation
3. Knowledge extraction and graph construction
4. Search and Q&A functionality
5. Graph visualization with Cytoscape.js
6. File upload handling

## Environment Variables

Required variables in `.env`:

```env
# Neo4j Aura
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Optional PostgreSQL variables (for auxiliary data):
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=knowledge_poc
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password
```

## Contributing

This is a POC project focused on demonstrating the feasibility of multimodal knowledge graph construction. The codebase prioritizes rapid prototyping over production-ready features.

## License

This project is for proof-of-concept purposes.