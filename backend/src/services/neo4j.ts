import neo4j, { Driver, Session, Result } from 'neo4j-driver';
import { config } from '../config/environment';

class Neo4jService {
  private driver: Driver;
  private static instance: Neo4jService;

  private constructor() {
    this.driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.username, config.neo4j.password)
    );
  }

  public static getInstance(): Neo4jService {
    if (!Neo4jService.instance) {
      Neo4jService.instance = new Neo4jService();
    }
    return Neo4jService.instance;
  }

  public async testConnection(): Promise<boolean> {
    const session = this.driver.session();
    try {
      await session.run('RETURN 1 as test');
      console.log('✅ Neo4j connection successful');
      return true;
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error);
      return false;
    } finally {
      await session.close();
    }
  }

  public getSession(): Session {
    return this.driver.session();
  }

  public async runQuery(cypher: string, parameters: any = {}): Promise<Result> {
    const session = this.driver.session();
    try {
      const result = await session.run(cypher, parameters);
      return result;
    } finally {
      await session.close();
    }
  }

  public async runTransaction(queries: Array<{ cypher: string; parameters?: any }>): Promise<Result[]> {
    const session = this.driver.session();
    try {
      return await session.executeWrite(async (tx) => {
        const results: Result[] = [];
        for (const query of queries) {
          const result = await tx.run(query.cypher, query.parameters || {});
          results.push(result);
        }
        return results;
      });
    } finally {
      await session.close();
    }
  }

  // Initialize database schema and constraints
  public async initializeSchema(): Promise<void> {
    const session = this.driver.session();
    
    try {
      // Create constraints for unique identifiers
      await session.run(`
        CREATE CONSTRAINT concept_id IF NOT EXISTS 
        FOR (c:Concept) REQUIRE c.id IS UNIQUE
      `);
      
      await session.run(`
        CREATE CONSTRAINT entity_id IF NOT EXISTS 
        FOR (e:Entity) REQUIRE e.id IS UNIQUE
      `);
      
      await session.run(`
        CREATE CONSTRAINT document_id IF NOT EXISTS 
        FOR (d:Document) REQUIRE d.id IS UNIQUE
      `);
      
      await session.run(`
        CREATE CONSTRAINT page_id IF NOT EXISTS 
        FOR (p:Page) REQUIRE p.id IS UNIQUE
      `);

      // Create vector indices for semantic search (if supported by Neo4j version)
      try {
        await session.run(`
          CREATE VECTOR INDEX page_embeddings IF NOT EXISTS
          FOR (p:Page) ON (p.summaryEmbedding)
          OPTIONS {indexConfig: {
            \`vector.dimensions\`: 1536,
            \`vector.similarity_function\`: 'cosine'
          }}
        `);
      } catch (error) {
        console.warn('Vector index creation failed (may not be supported in this Neo4j version):', error);
      }

      console.log('✅ Neo4j schema initialized');
    } catch (error) {
      console.error('❌ Schema initialization failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  public async clearDatabase(): Promise<void> {
    const session = this.driver.session();
    try {
      // Delete all nodes and relationships
      await session.run('MATCH (n) DETACH DELETE n');
      console.log('✅ Neo4j database cleared successfully');
    } finally {
      await session.close();
    }
  }

  public async close(): Promise<void> {
    await this.driver.close();
  }
}

export default Neo4jService;