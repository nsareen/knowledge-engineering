import { ConceptNode, EntityNode, RelationshipNode, GraphRelationship } from '@knowledge-poc/shared';
import Neo4jService from './neo4j';
import { WorkflowOrchestrator } from '../agents/workflow-orchestrator';
import { ConceptExtractionAgent } from '../agents/concept-extraction-agent';
import { EntityRecognitionAgent } from '../agents/entity-recognition-agent';
import { RelationshipMappingAgent } from '../agents/relationship-mapping-agent';

export interface KnowledgeExtractionResult {
  concepts: ConceptNode[];
  entities: EntityNode[];
  relationships: RelationshipNode[];
  correlations: GraphRelationship[];
  workflowExecution: any;
}

export class KnowledgeGraphConstructor {
  private neo4j: Neo4jService;
  private orchestrator: WorkflowOrchestrator;
  private conceptAgent: ConceptExtractionAgent;
  private entityAgent: EntityRecognitionAgent;
  private relationshipAgent: RelationshipMappingAgent;

  constructor() {
    this.neo4j = Neo4jService.getInstance();
    this.orchestrator = new WorkflowOrchestrator();
    this.conceptAgent = new ConceptExtractionAgent();
    this.entityAgent = new EntityRecognitionAgent();
    this.relationshipAgent = new RelationshipMappingAgent();
  }

  /**
   * Extract knowledge from processed document pages using multi-agent workflow
   */
  async extractKnowledge(
    documentId: string,
    pages: Array<{
      pageId: string;
      pageNumber: number;
      extractedText: string;
      summary: string;
    }>,
    options: {
      domain?: string;
      metamodel?: string;
      extractionPrompt?: string;
    } = {}
  ): Promise<KnowledgeExtractionResult> {
    console.log(`🧠 Starting knowledge extraction for document ${documentId}`);

    const allConcepts: ConceptNode[] = [];
    const allEntities: EntityNode[] = [];
    const allRelationships: RelationshipNode[] = [];
    const allCorrelations: GraphRelationship[] = [];

    // Process each page with the multi-agent workflow
    for (const page of pages) {
      console.log(`📄 Processing page ${page.pageNumber}`);

      const pageData = {
        documentId,
        pageId: page.pageId,
        pageNumber: page.pageNumber,
        extractedText: page.extractedText,
        summary: page.summary,
        ...options
      };

      // Execute workflow: Concepts → Entities → Relationships (sequential)
      const workflowExecution = await this.orchestrator.executeWorkflow(
        [this.conceptAgent, this.entityAgent],
        pageData,
        { parallel: false, stopOnError: false }
      );

      // Extract results from workflow execution
      const conceptResults = this.extractAgentResults(workflowExecution, 'ConceptExtraction');
      const entityResults = this.extractAgentResults(workflowExecution, 'EntityRecognition');

      if (conceptResults?.concepts) {
        allConcepts.push(...conceptResults.concepts);
      }

      if (entityResults?.entities) {
        allEntities.push(...entityResults.entities);
      }

      // Now run relationship mapping with the extracted concepts and entities
      const relationshipData = {
        ...pageData,
        concepts: conceptResults?.concepts || [],
        entities: entityResults?.entities || []
      };

      try {
        const relationshipOutput = await this.relationshipAgent.execute({
          data: relationshipData,
          workflowId: workflowExecution.id
        });

        if (relationshipOutput.result?.relationships) {
          allRelationships.push(...relationshipOutput.result.relationships);
        }
      } catch (error) {
        console.warn(`⚠️ Relationship extraction failed for page ${page.pageNumber}:`, error);
      }

      // Create correlations (cross-graph relationships)
      const correlations = this.createCorrelations(
        conceptResults?.concepts || [],
        entityResults?.entities || [],
        page.pageId
      );
      
      allCorrelations.push(...correlations);
    }

    // Deduplicate and merge similar items
    const deduplicatedConcepts = this.deduplicateConcepts(allConcepts);
    const deduplicatedEntities = this.deduplicateEntities(allEntities);
    const deduplicatedRelationships = this.deduplicateRelationships(allRelationships);

    console.log(`✅ Knowledge extraction complete:
      - ${deduplicatedConcepts.length} concepts
      - ${deduplicatedEntities.length} entities  
      - ${deduplicatedRelationships.length} relationships
      - ${allCorrelations.length} correlations`);

    return {
      concepts: deduplicatedConcepts,
      entities: deduplicatedEntities,
      relationships: deduplicatedRelationships,
      correlations: allCorrelations,
      workflowExecution: null // Last workflow execution
    };
  }

  /**
   * Save extracted knowledge to the graph database
   */
  async saveKnowledgeToGraph(
    documentId: string,
    knowledge: KnowledgeExtractionResult
  ): Promise<void> {
    const session = this.neo4j.getSession();

    try {
      console.log(`💾 Saving knowledge graph for document ${documentId}`);

      // Create concepts
      for (const concept of knowledge.concepts) {
        await session.run(`
          MERGE (c:Concept {id: $id})
          SET c.name = $name,
              c.definition = $definition,
              c.domain = $domain,
              c.confidence = $confidence,
              c.metamodelMapped = $metamodelMapped,
              c.taxonomy = $taxonomy,
              c.createdAt = $createdAt,
              c.updatedAt = $updatedAt
        `, {
          id: concept.id,
          name: concept.properties.name,
          definition: concept.properties.definition,
          domain: concept.properties.domain,
          confidence: concept.properties.confidence,
          metamodelMapped: concept.properties.metamodelMapped,
          taxonomy: concept.properties.taxonomy || null,
          createdAt: concept.createdAt,
          updatedAt: concept.updatedAt
        });
      }

      // Create entities
      for (const entity of knowledge.entities) {
        await session.run(`
          MERGE (e:Entity {id: $id})
          SET e.name = $name,
              e.type = $type,
              e.description = $description,
              e.confidence = $confidence,
              e.attributes = $attributes,
              e.createdAt = $createdAt,
              e.updatedAt = $updatedAt
        `, {
          id: entity.id,
          name: entity.properties.name,
          type: entity.properties.type,
          description: entity.properties.description,
          confidence: entity.properties.confidence,
          attributes: JSON.stringify(entity.properties.attributes),
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt
        });
      }

      // Create relationships
      for (const relationship of knowledge.relationships) {
        await session.run(`
          MATCH (source {id: $sourceId}), (target {id: $targetId})
          MERGE (source)-[r:RELATES {type: $relType, id: $id}]->(target)
          SET r.description = $description,
              r.confidence = $confidence,
              r.createdAt = $createdAt,
              r.updatedAt = $updatedAt
        `, {
          id: relationship.id,
          sourceId: relationship.properties.sourceEntityId,
          targetId: relationship.properties.targetEntityId,
          relType: relationship.properties.type,
          description: relationship.properties.description,
          confidence: relationship.properties.confidence,
          createdAt: relationship.createdAt,
          updatedAt: relationship.updatedAt
        });
      }

      // Create cross-graph correlations
      for (const correlation of knowledge.correlations) {
        await session.run(`
          MATCH (source {id: $sourceId}), (target {id: $targetId})
          MERGE (source)-[r:${correlation.type} {id: $id}]->(target)
          SET r.properties = $properties
        `, {
          id: correlation.id,
          sourceId: correlation.startNodeId,
          targetId: correlation.endNodeId,
          properties: JSON.stringify(correlation.properties)
        });
      }

      console.log(`✅ Knowledge graph saved successfully`);

    } catch (error) {
      console.error(`❌ Failed to save knowledge graph:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  private extractAgentResults(workflowExecution: any, agentName: string): any {
    const step = workflowExecution.steps.find((step: any) => step.agentName === agentName);
    return step?.success ? step.output.result : null;
  }

  private createCorrelations(
    concepts: ConceptNode[],
    entities: EntityNode[],
    pageId: string
  ): GraphRelationship[] {
    const correlations: GraphRelationship[] = [];

    // Create EXTRACTED_FROM relationships
    [...concepts, ...entities].forEach(item => {
      correlations.push({
        id: `correlation_${item.id}_${pageId}`,
        type: 'EXTRACTED_FROM',
        startNodeId: item.id,
        endNodeId: pageId,
        properties: {
          extractionConfidence: item.properties.confidence,
          createdAt: new Date().toISOString()
        }
      });
    });

    return correlations;
  }

  private deduplicateConcepts(concepts: ConceptNode[]): ConceptNode[] {
    const seen = new Map<string, ConceptNode>();
    
    concepts.forEach(concept => {
      const key = concept.properties.name.toLowerCase();
      const existing = seen.get(key);
      
      if (!existing || concept.properties.confidence > existing.properties.confidence) {
        seen.set(key, concept);
      }
    });

    return Array.from(seen.values());
  }

  private deduplicateEntities(entities: EntityNode[]): EntityNode[] {
    const seen = new Map<string, EntityNode>();
    
    entities.forEach(entity => {
      const key = `${entity.properties.name.toLowerCase()}_${entity.properties.type}`;
      const existing = seen.get(key);
      
      if (!existing || entity.properties.confidence > existing.properties.confidence) {
        seen.set(key, entity);
      }
    });

    return Array.from(seen.values());
  }

  private deduplicateRelationships(relationships: RelationshipNode[]): RelationshipNode[] {
    const seen = new Map<string, RelationshipNode>();
    
    relationships.forEach(rel => {
      const key = `${rel.properties.sourceEntityId}_${rel.properties.type}_${rel.properties.targetEntityId}`;
      const existing = seen.get(key);
      
      if (!existing || rel.properties.confidence > existing.properties.confidence) {
        seen.set(key, rel);
      }
    });

    return Array.from(seen.values());
  }
}