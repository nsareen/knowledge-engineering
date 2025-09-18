import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import OpenAIService from '../services/openai';
import { EntityNode } from '@knowledge-poc/shared';

export class EntityRecognitionAgent extends BaseAgent {
  private openai: OpenAIService;

  constructor() {
    super(
      'EntityRecognition',
      'Identifies and extracts named entities (people, organizations, locations, etc.) from content'
    );
    this.openai = OpenAIService.getInstance();
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    if (!this.validateInput(input)) {
      throw new Error('Invalid input for EntityRecognitionAgent');
    }

    const startTime = new Date();
    this.log('Starting entity recognition');

    try {
      const { extractedText, pageNumber, documentId, domain } = input.data;

      // Extract entities using GPT-4
      const prompt = this.buildEntityExtractionPrompt(extractedText, domain);
      const response = await this.openai.extractStructuredData(extractedText, undefined, domain);

      // Convert to EntityNode format
      const entities: EntityNode[] = response.entities.map(entity => ({
        id: this.generateEntityId(entity.name, entity.type),
        labels: ['Entity'],
        properties: {
          name: entity.name,
          type: this.normalizeEntityType(entity.type),
          description: this.generateDescription(entity),
          confidence: entity.confidence,
          attributes: entity.attributes || {}
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Group entities by type for analysis
      const entityTypes = this.groupEntitiesByType(entities);

      const result = {
        entities,
        entityTypes,
        metadata: {
          totalEntities: entities.length,
          highConfidenceEntities: entities.filter(e => e.properties.confidence > 0.8).length,
          pageNumber,
          documentId,
          typeDistribution: entityTypes
        }
      };

      this.log(`Recognized ${entities.length} entities across ${Object.keys(entityTypes).length} types`);

      return {
        result,
        confidence: this.calculateOverallConfidence(entities),
        metadata: {
          processingTime: new Date().getTime() - startTime.getTime(),
          entityCount: entities.length,
          uniqueTypes: Object.keys(entityTypes).length
        },
        citations: [{
          source: documentId,
          page: pageNumber
        }]
      };

    } catch (error: any) {
      this.log(`Entity recognition failed: ${error.message}`, 'error');
      throw error;
    }
  }

  private buildEntityExtractionPrompt(text: string, domain?: string): string {
    let prompt = `Extract named entities from the following text. For each entity, provide:
1. Entity name (exact text from source)
2. Entity type (PERSON, ORGANIZATION, LOCATION, DATE, MONEY, PRODUCT, EVENT, etc.)
3. Confidence score (0-1)
4. Relevant attributes (title, role, description, etc.)

Focus on entities that are significant to understanding the content.`;

    if (domain) {
      prompt += `\n\nDomain context: ${domain}. Pay special attention to domain-specific entities.`;
    }

    return prompt;
  }

  private generateEntityId(name: string, type: string): string {
    const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const cleanType = type.toLowerCase().replace(/\s+/g, '_');
    return `entity_${cleanType}_${cleanName}`;
  }

  private normalizeEntityType(type: string): string {
    // Normalize common entity types
    const typeMapping: Record<string, string> = {
      'person': 'PERSON',
      'people': 'PERSON',
      'individual': 'PERSON',
      'organization': 'ORGANIZATION',
      'org': 'ORGANIZATION',
      'company': 'ORGANIZATION',
      'corporation': 'ORGANIZATION',
      'location': 'LOCATION',
      'place': 'LOCATION',
      'city': 'LOCATION',
      'country': 'LOCATION',
      'date': 'DATE',
      'time': 'DATE',
      'datetime': 'DATE',
      'money': 'MONEY',
      'currency': 'MONEY',
      'amount': 'MONEY',
      'product': 'PRODUCT',
      'service': 'PRODUCT',
      'technology': 'TECHNOLOGY',
      'software': 'TECHNOLOGY',
      'system': 'TECHNOLOGY'
    };

    const normalized = typeMapping[type.toLowerCase()] || type.toUpperCase();
    return normalized;
  }

  private generateDescription(entity: any): string {
    let description = entity.name;
    
    if (entity.attributes?.title) {
      description += ` (${entity.attributes.title})`;
    }
    
    if (entity.attributes?.role) {
      description += ` - ${entity.attributes.role}`;
    }

    if (entity.attributes?.description) {
      description += ` - ${entity.attributes.description}`;
    }

    return description;
  }

  private groupEntitiesByType(entities: EntityNode[]): Record<string, number> {
    const typeGroups: Record<string, number> = {};
    
    entities.forEach(entity => {
      const type = entity.properties.type;
      typeGroups[type] = (typeGroups[type] || 0) + 1;
    });

    return typeGroups;
  }

  private calculateOverallConfidence(entities: EntityNode[]): number {
    if (entities.length === 0) return 0;
    
    const avgConfidence = entities.reduce((sum, entity) => 
      sum + entity.properties.confidence, 0) / entities.length;
    
    // Boost confidence based on entity diversity
    const uniqueTypes = new Set(entities.map(e => e.properties.type)).size;
    const diversityBoost = Math.min(uniqueTypes / 5, 0.2); // Max 20% boost
    
    return Math.min(avgConfidence + diversityBoost, 1.0);
  }
}