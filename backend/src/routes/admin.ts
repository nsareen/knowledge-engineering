import express from 'express';
import Neo4jService from '../services/neo4j';

const router = express.Router();

// Clear entire database - DANGER: This deletes everything!
router.post('/clear-graph', async (req, res) => {
  try {
    console.log('🚨 CLEARING ENTIRE NEO4J DATABASE...');
    const neo4j = Neo4jService.getInstance();
    await neo4j.clearDatabase();

    res.json({
      success: true,
      message: 'Knowledge graph cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear knowledge graph',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;