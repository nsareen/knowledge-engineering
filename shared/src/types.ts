// Graph Node Types
export interface BaseNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Subject Graph (Knowledge Graph) Types
export interface ConceptNode extends BaseNode {
  labels: ['Concept'];
  properties: {
    name: string;
    definition?: string;
    domain?: string;
    confidence: number;
    metamodelMapped: boolean;
    taxonomy?: string;
  };
}

export interface EntityNode extends BaseNode {
  labels: ['Entity'];
  properties: {
    name: string;
    type: string;
    description?: string;
    confidence: number;
    attributes: Record<string, any>;
  };
}

export interface RelationshipNode extends BaseNode {
  labels: ['Relationship'];
  properties: {
    type: string;
    description?: string;
    confidence: number;
    sourceEntityId: string;
    targetEntityId: string;
  };
}

// Lexical Graph (Content Graph) Types
export interface DocumentNode extends BaseNode {
  labels: ['Document'];
  properties: {
    filename: string;
    originalPath: string;
    fileType: 'pdf' | 'pptx';
    totalPages: number;
    uploadedAt: string;
    processedAt?: string;
    domain?: string;
  };
}

export interface PageNode extends BaseNode {
  labels: ['Page'];
  properties: {
    pageNumber: number;
    summary: string;
    summaryEmbedding?: number[];
    extractedText: string;
    hasImages: boolean;
    hasCharts: boolean;
    hasTables: boolean;
    documentId: string;
  };
}

export interface ImageNode extends BaseNode {
  labels: ['Image'];
  properties: {
    base64Data: string;
    format: string;
    description?: string;
    pageId: string;
  };
}

export interface AnnotationNode extends BaseNode {
  labels: ['Annotation'];
  properties: {
    content: string;
    type: 'remark' | 'note' | 'comment' | 'highlight';
    pageId: string;
    position?: {
      x: number;
      y: number;
      width?: number;
      height?: number;
    };
  };
}

// Relationship Types
export type GraphRelationship = {
  id: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  properties: Record<string, any>;
};

// Cross-graph relationship types
export type CrossGraphRelationshipType = 
  | 'EXTRACTED_FROM'  // Concept/Entity -> Page
  | 'MENTIONS'        // Page -> Concept (loose reference)
  | 'CITES'          // Direct citation
  | 'CORRELATES_WITH' // Semantic similarity
  | 'CONTAINS'       // Document -> Page, Page -> Image
  | 'RELATES_TO'     // Entity -> Entity
  | 'IS_A'           // Concept hierarchy
  | 'HAS_ATTRIBUTE'; // Entity -> Attribute

// API Types
export interface DocumentUploadResponse {
  documentId: string;
  filename: string;
  totalPages: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
}

export interface ExtractionResult {
  concepts: ConceptNode[];
  entities: EntityNode[];
  relationships: RelationshipNode[];
  pages: PageNode[];
  images: ImageNode[];
  annotations: AnnotationNode[];
  correlations: GraphRelationship[];
}

export interface SearchRequest {
  query: string;
  searchType: 'concept' | 'content' | 'hybrid' | 'semantic';
  filters?: {
    documentIds?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    confidence?: number;
    domains?: string[];
  };
}

export interface SearchResult {
  nodeId: string;
  nodeType: string;
  relevanceScore: number;
  content: string;
  citations: Citation[];
  path?: GraphPath;
}

export interface Citation {
  documentId: string;
  filename: string;
  pageNumber: number;
  nodeId: string;
  excerpt?: string;
}

export interface GraphPath {
  nodes: BaseNode[];
  relationships: GraphRelationship[];
  totalScore: number;
}

export interface QARequest {
  question: string;
  context?: {
    documentIds?: string[];
    domain?: string;
  };
}

export interface QAResponse {
  answer: string;
  confidence: number;
  reasoning: string[];
  citations: Citation[];
  relatedConcepts: string[];
}

export interface GapAnalysis {
  documentId: string;
  expectedConcepts: string[];
  foundConcepts: string[];
  missingConcepts: string[];
  recommendations: string[];
  completenessScore: number;
}

// Agent Workflow Types
export interface AgentStep {
  agentName: string;
  action: string;
  input: any;
  output: any;
  timestamp: string;
  duration: number;
  success: boolean;
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  documentId: string;
  steps: AgentStep[];
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  totalDuration?: number;
}

// Metamodel Types
export interface Metamodel {
  id: string;
  name: string;
  domain: string;
  concepts: MetamodelConcept[];
  relationships: MetamodelRelationship[];
  version: string;
}

export interface MetamodelConcept {
  name: string;
  description: string;
  attributes: string[];
  synonyms: string[];
  category: string;
}

export interface MetamodelRelationship {
  source: string;
  target: string;
  type: string;
  description: string;
  cardinality: '1:1' | '1:N' | 'N:N';
}