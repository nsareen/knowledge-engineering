import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import OpenAIService from '../services/openai';
import { ConceptNode } from '@knowledge-poc/shared';

export class ConceptExtractionAgent extends BaseAgent {
  private openai: OpenAIService;

  constructor() {
    super(
      'ConceptExtraction',
      'Extracts key concepts and their definitions from document content'
    );
    this.openai = OpenAIService.getInstance();
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    if (!this.validateInput(input)) {
      throw new Error('Invalid input for ConceptExtractionAgent');
    }

    const startTime = new Date();
    this.log('Starting concept extraction');

    try {
      const { extractedText, pageNumber, documentId, domain, metamodel } = input.data;

      // Build concept extraction prompt
      const prompt = this.buildExtractionPrompt(extractedText, domain, metamodel);

      // Extract concepts using GPT-4
      const response = await this.openai.extractStructuredData(
        extractedText, 
        metamodel, 
        domain
      );

      // Convert to ConceptNode format
      const concepts: ConceptNode[] = response.concepts.map(concept => ({
        id: this.generateConceptId(concept.name),
        labels: ['Concept'],
        properties: {
          name: concept.name,
          definition: concept.definition,
          domain: domain,
          confidence: concept.confidence,
          metamodelMapped: !!metamodel && this.isInMetamodel(concept.name, metamodel),
          taxonomy: this.extractTaxonomy(concept.name, metamodel)
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      const result = {
        concepts,
        metadata: {
          totalConcepts: concepts.length,
          highConfidenceConcepts: concepts.filter(c => c.properties.confidence > 0.8).length,
          pageNumber,
          documentId
        }
      };

      this.log(`Extracted ${concepts.length} concepts (${result.metadata.highConfidenceConcepts} high confidence)`);

      return {
        result,
        confidence: this.calculateOverallConfidence(concepts),
        metadata: {
          processingTime: new Date().getTime() - startTime.getTime(),
          conceptCount: concepts.length
        },
        citations: [{
          source: documentId,
          page: pageNumber
        }]
      };

    } catch (error: any) {
      this.log(`Concept extraction failed: ${error.message}`, 'error');
      throw error;
    }
  }

  private buildExtractionPrompt(text: string, domain?: string, metamodel?: string): string {
    let prompt = `Extract key concepts from the following text. For each concept, provide:
1. The concept name (clear, concise)
2. A definition or description
3. A confidence score (0-1) based on how clearly the concept is defined

Focus on domain-specific concepts, technical terms, and important ideas that would be valuable in a knowledge graph.`;

    if (domain) {
      prompt += `\n\nDomain context: ${domain}`;
    }

    if (metamodel) {
      prompt += `\n\nUse this metamodel as guidance: ${metamodel}`;
    }

    return prompt;
  }

  private generateConceptId(conceptName: string): string {
    // Generate a consistent ID based on the concept name
    return `concept_${conceptName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
  }

  private isInMetamodel(conceptName: string, metamodel: string): boolean {
    if (!metamodel) return false;
    return metamodel.toLowerCase().includes(conceptName.toLowerCase());
  }

  private extractTaxonomy(conceptName: string, metamodel?: string): string | undefined {
    if (!metamodel) return undefined;
    
    // Simple taxonomy extraction - in production, this would be more sophisticated
    const lines = metamodel.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(conceptName.toLowerCase())) {
        return line.trim();
      }
    }
    return undefined;
  }

  private calculateOverallConfidence(concepts: ConceptNode[]): number {
    if (concepts.length === 0) return 0;
    
    const avgConfidence = concepts.reduce((sum, concept) => 
      sum + concept.properties.confidence, 0) / concepts.length;
    
    return Math.min(avgConfidence, 1.0);
  }
}