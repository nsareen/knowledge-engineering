import express from 'express';
import multer from 'multer';
import { DocumentUploadResponse } from '@knowledge-poc/shared';
import DocumentProcessorService from '../services/document-processor';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and PPTX files are allowed'));
    }
  }
});

// Upload document endpoint
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { domain, metamodel, extractionPrompt } = req.body;
    
    console.log(`📄 Processing document: ${req.file.originalname} (${req.file.size} bytes)`);

    // Initialize document processor
    const processor = new DocumentProcessorService();
    
    // Process document based on file type
    let processedDoc;
    const fileType = req.file.mimetype;
    
    if (fileType === 'application/pdf') {
      processedDoc = await processor.processPDF(req.file.buffer, req.file.originalname, {
        domain,
        metamodel,
        extractionPrompt
      });
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      processedDoc = await processor.processPowerPoint(req.file.buffer, req.file.originalname, {
        domain,
        metamodel,
        extractionPrompt
      });
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Save to graph database and extract knowledge
    await processor.saveToGraph(processedDoc, {
      domain,
      metamodel,
      extractionPrompt
    });

    const response: DocumentUploadResponse = {
      documentId: processedDoc.document.id,
      filename: req.file.originalname,
      totalPages: processedDoc.document.properties.totalPages,
      status: 'completed'
    };

    res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: `Upload failed: ${error.message}` });
  }
});

// Get document status
router.get('/:documentId/status', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const processor = new DocumentProcessorService();
    const status = await processor.getDocumentStatus(documentId);
    
    if (!status) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to get document status' });
  }
});

// Get document pages
router.get('/:documentId/pages', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // TODO: Query Neo4j for document pages
    res.json({
      documentId,
      pages: []
    });
  } catch (error) {
    console.error('Pages retrieval error:', error);
    res.status(500).json({ error: 'Failed to get document pages' });
  }
});

// Get all documents with extraction stats
router.get('/', async (req, res) => {
  try {
    const processor = new DocumentProcessorService();
    const neo4j = processor['neo4j']; // Access private neo4j instance

    const query = `
      MATCH (d:Document)
      OPTIONAL MATCH (d)-[:CONTAINS]->(p:Page)
      OPTIONAL MATCH (c:Concept)-[:EXTRACTED_FROM]->(p)
      OPTIONAL MATCH (e:Entity)-[:EXTRACTED_FROM]->(p)
      OPTIONAL MATCH ()-[r:RELATES]->()
      WHERE (c)-[:EXTRACTED_FROM]->(p) OR (e)-[:EXTRACTED_FROM]->(p)
      RETURN d.id as documentId, 
             d.filename as filename,
             d.fileType as fileType,
             d.totalPages as totalPages,
             d.uploadedAt as uploadedAt,
             d.processedAt as processedAt,
             d.domain as domain,
             count(DISTINCT p) as processedPages,
             count(DISTINCT c) as concepts,
             count(DISTINCT e) as entities,
             count(DISTINCT r) as relationships
      ORDER BY d.uploadedAt DESC
    `;

    const result = await neo4j.runQuery(query);
    const documents = result.records.map(record => {
      const totalPages = record.get('totalPages');
      const processedPages = record.get('processedPages');
      const concepts = record.get('concepts');
      const entities = record.get('entities');
      const relationships = record.get('relationships');

      return {
        documentId: record.get('documentId'),
        filename: record.get('filename'),
        fileType: record.get('fileType'),
        totalPages: totalPages ? (typeof totalPages.toNumber === 'function' ? totalPages.toNumber() : Number(totalPages)) : 0,
        uploadedAt: record.get('uploadedAt'),
        processedAt: record.get('processedAt'),
        domain: record.get('domain'),
        status: record.get('processedAt') ? 'completed' : 'processing',
        extractionStats: {
          processedPages: processedPages ? (typeof processedPages.toNumber === 'function' ? processedPages.toNumber() : Number(processedPages)) : 0,
          concepts: concepts ? (typeof concepts.toNumber === 'function' ? concepts.toNumber() : Number(concepts)) : 0,
          entities: entities ? (typeof entities.toNumber === 'function' ? entities.toNumber() : Number(entities)) : 0,
          relationships: relationships ? (typeof relationships.toNumber === 'function' ? relationships.toNumber() : Number(relationships)) : 0
        }
      };
    });

    res.json({
      documents,
      totalDocuments: documents.length
    });
  } catch (error) {
    console.error('Documents list error:', error);
    res.status(500).json({ error: 'Failed to get documents list' });
  }
});

export default router;