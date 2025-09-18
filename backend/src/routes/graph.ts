import express from 'express';
import { BaseNode, GraphRelationship } from '@knowledge-poc/shared';
import Neo4jService from '../services/neo4j';
import neo4jDriver from 'neo4j-driver';

const router = express.Router();

// Get graph structure
router.get('/', async (req, res) => {
  try {
    const { nodeTypes, limit = 100, documentId } = req.query;
    const neo4j = Neo4jService.getInstance();

    let nodeQuery = '';
    let relationshipQuery = '';
    const limitNumber = Math.floor(Number(limit)) || 100;
    let queryParams: any = { limit: neo4jDriver.int(limitNumber) };

    // Build query based on filters
    if (documentId) {
      // Get nodes related to a specific document
      nodeQuery = `
        MATCH (d:Document {id: $documentId})
        MATCH (d)-[:CONTAINS]->(p:Page)
        MATCH (n)-[:EXTRACTED_FROM]->(p)
        WHERE n:Concept OR n:Entity
        RETURN n, labels(n) as nodeLabels
        LIMIT $limit
      `;
      queryParams.documentId = documentId;
    } else if (nodeTypes) {
      const types = (nodeTypes as string).split(',');
      const labelFilter = types.map(type => `n:${type.trim()}`).join(' OR ');
      nodeQuery = `
        MATCH (n) 
        WHERE ${labelFilter}
        RETURN n, labels(n) as nodeLabels
        LIMIT $limit
      `;
    } else {
      // Get all knowledge nodes
      nodeQuery = `
        MATCH (n) 
        WHERE n:Concept OR n:Entity OR n:Document OR n:Page
        RETURN n, labels(n) as nodeLabels
        LIMIT $limit
      `;
    }

    // Execute node query
    const nodeResult = await neo4j.runQuery(nodeQuery, queryParams);
    const nodes = nodeResult.records.map(record => {
      const node = record.get('n');
      const labels = record.get('nodeLabels');
      
      return {
        id: node.properties.id,
        labels: labels,
        properties: node.properties,
        createdAt: node.properties.createdAt || new Date().toISOString(),
        updatedAt: node.properties.updatedAt || new Date().toISOString()
      };
    });

    // Get relationships between returned nodes
    if (nodes.length > 0) {
      const nodeIds = nodes.map(n => n.id);
      relationshipQuery = `
        MATCH (source)-[r]->(target)
        WHERE source.id IN $nodeIds AND target.id IN $nodeIds
        RETURN source.id as sourceId, target.id as targetId, 
               type(r) as relationshipType, r.id as relationshipId,
               r as relationship
        LIMIT $limit
      `;
      
      const relResult = await neo4j.runQuery(relationshipQuery, {
        nodeIds,
        limit: neo4jDriver.int(limitNumber)
      });
      
      const relationships = relResult.records.map(record => ({
        id: record.get('relationshipId') || `${record.get('sourceId')}_${record.get('relationshipType')}_${record.get('targetId')}`,
        type: record.get('relationshipType'),
        startNodeId: record.get('sourceId'),
        endNodeId: record.get('targetId'),
        properties: record.get('relationship')?.properties || {}
      }));

      res.json({
        nodes,
        relationships,
        totalNodes: nodes.length,
        totalRelationships: relationships.length,
        limit: limitNumber,
        filters: { nodeTypes, documentId }
      });
    } else {
      res.json({
        nodes: [],
        relationships: [],
        totalNodes: 0,
        totalRelationships: 0,
        limit: limitNumber,
        filters: { nodeTypes, documentId }
      });
    }

  } catch (error) {
    console.error('Graph retrieval error:', error);
    res.status(500).json({ error: 'Failed to get graph structure' });
  }
});

// Get specific node with its connections
router.get('/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { depth = 1 } = req.query;

    // TODO: Query Neo4j for node and its connections
    res.json({
      node: null,
      connections: [],
      depth: parseInt(depth as string)
    });
  } catch (error) {
    console.error('Node retrieval error:', error);
    res.status(500).json({ error: 'Failed to get node' });
  }
});

// Get path between two nodes
router.get('/path/:startNodeId/:endNodeId', async (req, res) => {
  try {
    const { startNodeId, endNodeId } = req.params;
    const { maxDepth = 5 } = req.query;

    // TODO: Find shortest path using Neo4j algorithms
    res.json({
      path: null,
      distance: 0,
      maxDepth: parseInt(maxDepth as string)
    });
  } catch (error) {
    console.error('Path finding error:', error);
    res.status(500).json({ error: 'Failed to find path' });
  }
});

// Get graph statistics
router.get('/stats', async (req, res) => {
  try {
    const neo4j = Neo4jService.getInstance();

    // Get counts of different node types
    const statsQuery = `
      MATCH (n) 
      WITH labels(n) as nodeLabels, count(n) as count
      UNWIND nodeLabels as label
      RETURN label, sum(count) as totalCount
      ORDER BY totalCount DESC
    `;

    const result = await neo4j.runQuery(statsQuery);
    const nodeCounts = result.records.map(record => ({
      type: record.get('label'),
      count: record.get('totalCount').toNumber()
    }));

    // Get relationship counts
    const relStatsQuery = `
      MATCH ()-[r]->()
      RETURN type(r) as relationshipType, count(r) as count
      ORDER BY count DESC
    `;

    const relResult = await neo4j.runQuery(relStatsQuery);
    const relationshipCounts = relResult.records.map(record => ({
      type: record.get('relationshipType'),
      count: record.get('count').toNumber()
    }));

    // Get document-specific stats
    const docStatsQuery = `
      MATCH (d:Document)
      OPTIONAL MATCH (d)-[:CONTAINS]->(p:Page)
      OPTIONAL MATCH (c:Concept)-[:EXTRACTED_FROM]->(p)
      OPTIONAL MATCH (e:Entity)-[:EXTRACTED_FROM]->(p)
      RETURN d.id as documentId, d.filename as filename,
             count(DISTINCT p) as pages,
             count(DISTINCT c) as concepts,
             count(DISTINCT e) as entities
      ORDER BY d.filename
    `;

    const docResult = await neo4j.runQuery(docStatsQuery);
    const documentStats = docResult.records.map(record => ({
      documentId: record.get('documentId'),
      filename: record.get('filename'),
      pages: record.get('pages').toNumber(),
      concepts: record.get('concepts').toNumber(),
      entities: record.get('entities').toNumber()
    }));

    res.json({
      nodeCounts,
      relationshipCounts,
      documentStats,
      totalNodes: nodeCounts.reduce((sum, item) => sum + item.count, 0),
      totalRelationships: relationshipCounts.reduce((sum, item) => sum + item.count, 0)
    });

  } catch (error) {
    console.error('Graph stats error:', error);
    res.status(500).json({ error: 'Failed to get graph statistics' });
  }
});

export default router;