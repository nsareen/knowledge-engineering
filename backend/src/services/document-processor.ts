import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import mammoth from 'mammoth';
import { DocumentNode, PageNode, ImageNode } from '@knowledge-poc/shared';
import OpenAIService from './openai';
import Neo4jService from './neo4j';
import { KnowledgeGraphConstructor } from './knowledge-graph-constructor';

export interface ProcessedDocument {
  document: DocumentNode;
  pages: PageNode[];
  images: ImageNode[];
}

export interface DocumentProcessingOptions {
  domain?: string;
  metamodel?: string;
  extractionPrompt?: string;
}

class DocumentProcessorService {
  private openai: OpenAIService;
  private neo4j: Neo4jService;
  private knowledgeGraphConstructor: KnowledgeGraphConstructor;
  private tempDir: string;

  constructor() {
    this.openai = OpenAIService.getInstance();
    this.neo4j = Neo4jService.getInstance();
    this.knowledgeGraphConstructor = new KnowledgeGraphConstructor();
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Process a PDF document by converting pages to images
   */
  async processPDF(
    buffer: Buffer, 
    filename: string, 
    options: DocumentProcessingOptions = {}
  ): Promise<ProcessedDocument> {
    const documentId = uuidv4();
    const tempPath = path.join(this.tempDir, `${documentId}.pdf`);
    const execAsync = promisify(exec);

    try {
      // Save buffer to temp file
      await fs.writeFile(tempPath, buffer);

      // Convert PDF to images using pdftoppm (more reliable than pdf2pic)
      const outputPrefix = path.join(this.tempDir, `${documentId}-page`);
      const pdfToPpmCommand = `pdftoppm -png -r 300 "${tempPath}" "${outputPrefix}"`;
      
      console.log(`Converting PDF to images: ${pdfToPpmCommand}`);
      await execAsync(pdfToPpmCommand);

      // Find generated image files
      const files = await fs.readdir(this.tempDir);
      const imageFiles = files
        .filter(file => file.startsWith(`${documentId}-page`) && file.endsWith('.png'))
        .sort(); // Sort to ensure correct page order

      console.log(`PDF processing complete. Generated ${imageFiles.length} page images`);

      const pages: any[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const imagePath = path.join(this.tempDir, imageFiles[i]);
        pages.push({ 
          path: imagePath, 
          pageNumber: i + 1 
        });
      }

      const totalPages = pages.length;

      // Create document node
      const document: DocumentNode = {
        id: documentId,
        labels: ['Document'],
        properties: {
          filename,
          originalPath: filename,
          fileType: 'pdf',
          totalPages,
          uploadedAt: new Date().toISOString(),
          domain: options.domain || null
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Process each page
      const processedPages: PageNode[] = [];
      const processedImages: ImageNode[] = [];

      for (const page of pages) {
        const { pageNode, imageNode } = await this.processPage(
          page.path, 
          page.pageNumber, 
          documentId,
          options
        );
        processedPages.push(pageNode);
        processedImages.push(imageNode);
      }

      // Clean up temp files
      await this.cleanupTempFiles([tempPath, ...pages.map(p => p.path)]);

      return {
        document,
        pages: processedPages,
        images: processedImages
      };

    } catch (error) {
      console.error('PDF processing error:', error);
      // Clean up on error
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      throw new Error(`PDF processing failed: ${error}`);
    }
  }

  /**
   * Process a PowerPoint document by converting slides to images
   */
  async processPowerPoint(
    buffer: Buffer,
    filename: string,
    options: DocumentProcessingOptions = {}
  ): Promise<ProcessedDocument> {
    const documentId = uuidv4();
    
    try {
      // For this POC, we'll treat PPTX similar to PDF by converting to images
      // In a production system, you might use python-based solutions like python-pptx
      // For now, let's create a placeholder implementation
      
      const document: DocumentNode = {
        id: documentId,
        labels: ['Document'],
        properties: {
          filename,
          originalPath: filename,
          fileType: 'pptx',
          totalPages: 1, // Will be updated after processing
          uploadedAt: new Date().toISOString(),
          domain: options.domain || null
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // TODO: Implement proper PPTX to image conversion
      // For now, return empty structure
      console.warn('PPTX processing not fully implemented. Using placeholder.');
      
      return {
        document,
        pages: [],
        images: []
      };

    } catch (error) {
      console.error('PowerPoint processing error:', error);
      throw new Error(`PowerPoint processing failed: ${error}`);
    }
  }

  /**
   * Process a single page/slide image
   */
  private async processPage(
    imagePath: string,
    pageNumber: number,
    documentId: string,
    options: DocumentProcessingOptions
  ): Promise<{ pageNode: PageNode; imageNode: ImageNode }> {
    
    try {
      // Read and convert image to base64
      const imageBuffer = await fs.readFile(imagePath);
      const optimizedBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 85 })
        .toBuffer();
      
      const base64Image = optimizedBuffer.toString('base64');

      // Create extraction prompt
      const extractionPrompt = this.buildExtractionPrompt(options);

      // Analyze image with GPT-4 Vision
      const analysisResult = await this.openai.analyzeImage(base64Image, extractionPrompt);

      // Generate summary and embedding
      const summary = await this.openai.generateSummary(analysisResult);
      const summaryEmbedding = await this.openai.generateEmbedding(summary);

      // Create page node
      const pageId = uuidv4();
      const pageNode: PageNode = {
        id: pageId,
        labels: ['Page'],
        properties: {
          pageNumber,
          summary,
          summaryEmbedding,
          extractedText: analysisResult,
          hasImages: true, // Since we're processing an image
          hasCharts: analysisResult.toLowerCase().includes('chart') || analysisResult.toLowerCase().includes('graph'),
          hasTables: analysisResult.toLowerCase().includes('table'),
          documentId
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create image node
      const imageId = uuidv4();
      const imageNode: ImageNode = {
        id: imageId,
        labels: ['Image'],
        properties: {
          base64Data: base64Image,
          format: 'jpeg',
          description: `Page ${pageNumber} image`,
          pageId
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return { pageNode, imageNode };

    } catch (error) {
      console.error(`Page processing error for page ${pageNumber}:`, error);
      throw new Error(`Page processing failed: ${error}`);
    }
  }

  /**
   * Build extraction prompt based on options
   */
  private buildExtractionPrompt(options: DocumentProcessingOptions): string {
    let prompt = `Analyze this document page/slide image and extract:

1. All visible text content (including titles, body text, captions, labels)
2. Key concepts and their definitions
3. Named entities (people, organizations, locations, dates, etc.)
4. Relationships between concepts and entities
5. Any charts, graphs, or table data
6. Annotations, remarks, or informal notes
7. Visual elements that convey meaning

Provide a comprehensive analysis that captures both formal content and informal annotations.`;

    if (options.domain) {
      prompt += `\n\nContext: This document is from the ${options.domain} domain. Focus on concepts relevant to this field.`;
    }

    if (options.metamodel) {
      prompt += `\n\nMetamodel: Use this taxonomy as guidance for concept extraction:\n${options.metamodel}`;
    }

    if (options.extractionPrompt) {
      prompt += `\n\nAdditional instructions: ${options.extractionPrompt}`;
    }

    return prompt;
  }

  /**
   * Save processed document to Neo4j and extract knowledge
   */
  async saveToGraph(
    processedDoc: ProcessedDocument, 
    options: DocumentProcessingOptions = {}
  ): Promise<void> {
    try {
      const session = this.neo4j.getSession();
      
      // Create document node
      await session.run(`
        CREATE (d:Document {
          id: $id,
          filename: $filename,
          originalPath: $originalPath,
          fileType: $fileType,
          totalPages: $totalPages,
          uploadedAt: $uploadedAt,
          processedAt: $processedAt,
          domain: $domain
        })
      `, {
        id: processedDoc.document.id,
        filename: processedDoc.document.properties.filename,
        originalPath: processedDoc.document.properties.originalPath,
        fileType: processedDoc.document.properties.fileType,
        totalPages: processedDoc.document.properties.totalPages,
        uploadedAt: processedDoc.document.properties.uploadedAt,
        processedAt: new Date().toISOString(),
        domain: options.domain || processedDoc.document.properties.domain || null
      });

      // Create page nodes and relationships
      for (const page of processedDoc.pages) {
        await session.run(`
          MATCH (d:Document {id: $documentId})
          CREATE (p:Page {
            id: $id,
            pageNumber: $pageNumber,
            summary: $summary,
            summaryEmbedding: $summaryEmbedding,
            extractedText: $extractedText,
            hasImages: $hasImages,
            hasCharts: $hasCharts,
            hasTables: $hasTables,
            createdAt: $createdAt
          })
          CREATE (d)-[:CONTAINS]->(p)
        `, {
          documentId: processedDoc.document.id,
          id: page.id,
          pageNumber: page.properties.pageNumber,
          summary: page.properties.summary,
          summaryEmbedding: page.properties.summaryEmbedding,
          extractedText: page.properties.extractedText,
          hasImages: page.properties.hasImages,
          hasCharts: page.properties.hasCharts,
          hasTables: page.properties.hasTables,
          createdAt: page.createdAt
        });
      }

      // Create image nodes and relationships
      for (const image of processedDoc.images) {
        await session.run(`
          MATCH (p:Page {id: $pageId})
          CREATE (i:Image {
            id: $id,
            base64Data: $base64Data,
            format: $format,
            description: $description,
            createdAt: $createdAt
          })
          CREATE (p)-[:HAS_IMAGE]->(i)
        `, {
          pageId: image.properties.pageId,
          id: image.id,
          base64Data: image.properties.base64Data,
          format: image.properties.format,
          description: image.properties.description,
          createdAt: image.createdAt
        });
      }

      await session.close();
      console.log(`✅ Saved document ${processedDoc.document.properties.filename} to graph`);

      // Extract knowledge using multi-agent workflow
      if (processedDoc.pages.length > 0) {
        console.log(`🧠 Starting knowledge extraction for ${processedDoc.pages.length} pages`);
        
        const pageData = processedDoc.pages.map(page => ({
          pageId: page.id,
          pageNumber: page.properties.pageNumber,
          extractedText: page.properties.extractedText,
          summary: page.properties.summary
        }));

        const knowledge = await this.knowledgeGraphConstructor.extractKnowledge(
          processedDoc.document.id,
          pageData,
          options
        );

        // Save extracted knowledge to graph
        await this.knowledgeGraphConstructor.saveKnowledgeToGraph(
          processedDoc.document.id,
          knowledge
        );

        console.log(`✅ Knowledge extraction completed:
          - ${knowledge.concepts.length} concepts
          - ${knowledge.entities.length} entities
          - ${knowledge.relationships.length} relationships`);
      }

    } catch (error) {
      console.error('Failed to save document to graph:', error);
      throw new Error(`Graph save failed: ${error}`);
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete temp file ${filePath}:`, error);
      }
    }
  }

  /**
   * Get document processing status
   */
  async getDocumentStatus(documentId: string): Promise<any> {
    const session = this.neo4j.getSession();
    try {
      const result = await session.run(`
        MATCH (d:Document {id: $documentId})
        OPTIONAL MATCH (d)-[:CONTAINS]->(p:Page)
        RETURN d, count(p) as pageCount
      `, { documentId });

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const document = record.get('d');
      const pageCount = record.get('pageCount');

      return {
        documentId,
        filename: document.properties.filename,
        status: 'completed',
        totalPages: document.properties.totalPages,
        processedPages: pageCount.toNumber(),
        processedAt: document.properties.processedAt
      };

    } finally {
      await session.close();
    }
  }
}

export default DocumentProcessorService;