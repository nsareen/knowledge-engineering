import Neo4jService from './services/neo4j';
import OpenAIService from './services/openai';

export async function initializeServices(): Promise<boolean> {
  console.log('🚀 Initializing Knowledge Engineering Services...');
  
  try {
    // Test Neo4j connection
    console.log('📊 Testing Neo4j connection...');
    const neo4j = Neo4jService.getInstance();
    const neo4jConnected = await neo4j.testConnection();
    
    if (!neo4jConnected) {
      throw new Error('Neo4j connection failed');
    }

    // Initialize Neo4j schema
    console.log('🔧 Initializing Neo4j schema...');
    await neo4j.initializeSchema();

    // Test OpenAI connection
    console.log('🤖 Testing OpenAI connection...');
    const openai = OpenAIService.getInstance();
    // Simple test to see if API key works
    try {
      await openai.generateEmbedding('test');
      console.log('✅ OpenAI connection successful');
    } catch (error) {
      console.error('❌ OpenAI connection failed:', error);
      return false;
    }

    console.log('✅ All services initialized successfully!');
    return true;

  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    return false;
  }
}

export async function shutdownServices(): Promise<void> {
  console.log('🔄 Shutting down services...');
  
  try {
    const neo4j = Neo4jService.getInstance();
    await neo4j.close();
    console.log('✅ Services shut down gracefully');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}