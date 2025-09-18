import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import OpenAIService from '../services/openai';
import { RelationshipNode, ConceptNode, EntityNode } from '@knowledge-poc/shared';

export class RelationshipMappingAgent extends BaseAgent {
  private openai: OpenAIService;

  constructor() {
    super(
      'RelationshipMapping', 
      'Maps relationships between concepts and entities'
    );
    this.openai = OpenAIService.getInstance();
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    if (!this.validateInput(input)) {
      throw new Error('Invalid input for RelationshipMappingAgent');
    }

    const startTime = new Date();
    this.log('Starting relationship mapping');

    try {
      const { 
        extractedText, 
        concepts = [], 
        entities = [], 
        pageNumber, 
        documentId, 
        domain 
      } = input.data;

      // Extract relationships using GPT-4
      const relationshipsData = await this.extractRelationships(
        extractedText, 
        concepts, 
        entities, 
        domain
      );

      // Convert to RelationshipNode format
      const relationships: RelationshipNode[] = relationshipsData.map(rel => ({
        id: this.generateRelationshipId(rel.source, rel.target, rel.type),
        labels: ['Relationship'],
        properties: {
          type: this.normalizeRelationshipType(rel.type),
          description: rel.description || `${rel.source} ${rel.type} ${rel.target}`,
          confidence: rel.confidence,
          sourceEntityId: this.findEntityId(rel.source, [...concepts, ...entities]),
          targetEntityId: this.findEntityId(rel.target, [...concepts, ...entities])
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Filter out relationships where source or target couldn't be found
      const validRelationships = relationships.filter(rel => 
        rel.properties.sourceEntityId && rel.properties.targetEntityId
      );

      // Analyze relationship patterns
      const relationshipAnalysis = this.analyzeRelationships(validRelationships);

      const result = {
        relationships: validRelationships,
        analysis: relationshipAnalysis,
        metadata: {
          totalRelationships: validRelationships.length,
          invalidRelationships: relationships.length - validRelationships.length,
          highConfidenceRelationships: validRelationships.filter(r => r.properties.confidence > 0.8).length,
          pageNumber,
          documentId
        }
      };

      this.log(`Mapped ${validRelationships.length} relationships (${result.metadata.highConfidenceRelationships} high confidence)`);

      return {
        result,
        confidence: this.calculateOverallConfidence(validRelationships),
        metadata: {
          processingTime: new Date().getTime() - startTime.getTime(),
          relationshipCount: validRelationships.length,
          uniqueRelationshipTypes: relationshipAnalysis.typeDistribution.length
        },
        citations: [{
          source: documentId,
          page: pageNumber
        }]
      };

    } catch (error: any) {
      this.log(`Relationship mapping failed: ${error.message}`, 'error');
      throw error;
    }
  }

  private async extractRelationships(
    text: string, 
    concepts: ConceptNode[], 
    entities: EntityNode[],
    domain?: string
  ): Promise<any[]> {
    
    // Create a context with available concepts and entities
    const availableItems = [
      ...concepts.map(c => ({ name: c.properties.name, type: 'concept' })),
      ...entities.map(e => ({ name: e.properties.name, type: e.properties.type }))
    ];

    const prompt = this.buildRelationshipPrompt(text, availableItems, domain);
    const response = await this.openai.extractStructuredData(text, undefined, domain);

    return response.relationships || [];
  }

  private buildRelationshipPrompt(
    text: string, 
    availableItems: Array<{name: string, type: string}>, 
    domain?: string
  ): string {
    let prompt = `Identify relationships between the concepts and entities in the following text.

Available concepts and entities to connect:
${availableItems.map(item => `- ${item.name} (${item.type})`).join('\n')}

For each relationship, provide:
1. Source entity/concept name (must match exactly from the list above)
2. Relationship type (e.g., "uses", "contains", "leads to", "is part of", "manages", "affects")
3. Target entity/concept name (must match exactly from the list above)  
4. Confidence score (0-1)
5. Brief description (optional)

Focus on meaningful, explicitly stated relationships.`;

    if (domain) {
      prompt += `\n\nDomain context: ${domain}`;
    }

    return prompt;
  }

  private generateRelationshipId(source: string, target: string, type: string): string {
    const cleanSource = source.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const cleanTarget = target.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const cleanType = type.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return `rel_${cleanSource}_${cleanType}_${cleanTarget}`;
  }

  private normalizeRelationshipType(type: string): string {
    // Normalize common relationship types
    const typeMapping: Record<string, string> = {
      'uses': 'USES',
      'use': 'USES',
      'utilizes': 'USES',
      'contains': 'CONTAINS',
      'includes': 'CONTAINS',
      'has': 'HAS',
      'owns': 'OWNS',
      'manages': 'MANAGES',
      'leads': 'LEADS',
      'is part of': 'PART_OF',
      'belongs to': 'PART_OF',
      'relates to': 'RELATES_TO',
      'connected to': 'CONNECTS_TO',
      'affects': 'AFFECTS',
      'influences': 'INFLUENCES',
      'causes': 'CAUSES',
      'results in': 'CAUSES',
      'depends on': 'DEPENDS_ON',
      'requires': 'REQUIRES'
    };

    return typeMapping[type.toLowerCase()] || type.toUpperCase().replace(/\s+/g, '_');
  }

  private findEntityId(name: string, items: Array<ConceptNode | EntityNode>): string | undefined {
    const item = items.find(item => 
      item.properties.name.toLowerCase() === name.toLowerCase()
    );
    return item?.id;
  }

  private analyzeRelationships(relationships: RelationshipNode[]) {
    const typeDistribution = this.getTypeDistribution(relationships);
    const networkDensity = this.calculateNetworkDensity(relationships);
    const hubs = this.findHubs(relationships);

    return {
      typeDistribution,
      networkDensity,
      hubs: hubs.slice(0, 5), // Top 5 hubs
      totalRelationships: relationships.length
    };
  }

  private getTypeDistribution(relationships: RelationshipNode[]): Array<{type: string, count: number}> {
    const distribution: Record<string, number> = {};
    
    relationships.forEach(rel => {
      const type = rel.properties.type;
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateNetworkDensity(relationships: RelationshipNode[]): number {
    if (relationships.length === 0) return 0;

    const nodes = new Set<string>();
    relationships.forEach(rel => {
      nodes.add(rel.properties.sourceEntityId);
      nodes.add(rel.properties.targetEntityId);
    });

    const nodeCount = nodes.size;
    const maxPossibleEdges = nodeCount * (nodeCount - 1);
    
    return maxPossibleEdges > 0 ? relationships.length / maxPossibleEdges : 0;
  }

  private findHubs(relationships: RelationshipNode[]): Array<{nodeId: string, connections: number}> {
    const connectionCount: Record<string, number> = {};

    relationships.forEach(rel => {
      connectionCount[rel.properties.sourceEntityId] = 
        (connectionCount[rel.properties.sourceEntityId] || 0) + 1;
      connectionCount[rel.properties.targetEntityId] = 
        (connectionCount[rel.properties.targetEntityId] || 0) + 1;
    });

    return Object.entries(connectionCount)
      .map(([nodeId, connections]) => ({ nodeId, connections }))
      .sort((a, b) => b.connections - a.connections);
  }

  private calculateOverallConfidence(relationships: RelationshipNode[]): number {
    if (relationships.length === 0) return 0;
    
    const avgConfidence = relationships.reduce((sum, rel) => 
      sum + rel.properties.confidence, 0) / relationships.length;
    
    // Boost confidence based on relationship density
    const uniqueTypes = new Set(relationships.map(r => r.properties.type)).size;
    const densityBoost = Math.min(uniqueTypes / 10, 0.15); // Max 15% boost
    
    return Math.min(avgConfidence + densityBoost, 1.0);
  }
}