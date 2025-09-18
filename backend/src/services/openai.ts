import OpenAI from 'openai';
import { config } from '../config/environment';

class OpenAIService {
  private client: OpenAI;
  private static instance: OpenAIService;

  private constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  // Extract content from image using GPT-4 Vision
  public async analyzeImage(
    base64Image: string, 
    prompt: string = "Extract all text, concepts, entities, and relationships from this image. Also provide a comprehensive summary."
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for consistent extraction
      });

      return response.choices[0].message?.content || '';
    } catch (error) {
      console.error('Image analysis failed:', error);
      throw new Error(`Image analysis failed: ${error}`);
    }
  }

  // Extract structured data from text using GPT-4
  public async extractStructuredData(
    content: string,
    metamodel?: string,
    domain?: string
  ): Promise<{
    concepts: Array<{ name: string; definition?: string; confidence: number }>;
    entities: Array<{ name: string; type: string; attributes: Record<string, any>; confidence: number }>;
    relationships: Array<{ source: string; target: string; type: string; confidence: number }>;
  }> {
    const systemPrompt = `You are an expert knowledge engineer. Extract concepts, entities, and relationships from the provided content.
    
    ${metamodel ? `Use this metamodel as guidance: ${metamodel}` : ''}
    ${domain ? `Focus on the ${domain} domain.` : ''}
    
    Return a JSON object with:
    - concepts: Array of unique concepts with name, definition (optional), and confidence score (0-1)
    - entities: Array of named entities with name, type, attributes, and confidence score
    - relationships: Array of relationships between entities/concepts with source, target, type, and confidence score
    
    Be precise and avoid duplicates. Only include high-confidence extractions.`;

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const result = response.choices[0].message?.content;
      return result ? JSON.parse(result) : { concepts: [], entities: [], relationships: [] };
    } catch (error) {
      console.error('Structured extraction failed:', error);
      throw new Error(`Structured extraction failed: ${error}`);
    }
  }

  // Generate embeddings for semantic search
  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: "text-embedding-3-large",
        input: text,
        dimensions: 1536
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error(`Embedding generation failed: ${error}`);
    }
  }

  // Generate comprehensive summary
  public async generateSummary(content: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Create a comprehensive summary that captures all key information, including any informal notes, annotations, or remarks. Maintain important details that might be relevant for future searches."
          },
          { role: "user", content: content }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });

      return response.choices[0].message?.content || '';
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw new Error(`Summary generation failed: ${error}`);
    }
  }

  // Answer questions using context
  public async answerQuestion(
    question: string, 
    context: string[], 
    relatedConcepts: string[] = []
  ): Promise<{
    answer: string;
    confidence: number;
    reasoning: string[];
  }> {
    const systemPrompt = `You are a knowledgeable AI assistant that answers questions based on provided context from a knowledge graph. 
    
    Provide:
    1. A clear, comprehensive answer
    2. A confidence score (0-1) based on how well the context supports your answer
    3. Step-by-step reasoning showing how you arrived at the answer
    
    If the context doesn't contain enough information, say so and indicate what additional information would be needed.`;

    try {
      const contextText = context.join('\n\n---\n\n');
      const conceptsText = relatedConcepts.length > 0 ? `\nRelated concepts: ${relatedConcepts.join(', ')}` : '';

      const response = await this.client.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Question: ${question}\n\nContext:\n${contextText}${conceptsText}` 
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = response.choices[0].message?.content;
      return result ? JSON.parse(result) : {
        answer: "I don't have enough information to answer this question.",
        confidence: 0,
        reasoning: ["Insufficient context provided"]
      };
    } catch (error) {
      console.error('Question answering failed:', error);
      throw new Error(`Question answering failed: ${error}`);
    }
  }
}

export default OpenAIService;