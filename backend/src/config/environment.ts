import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password'
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },
  
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'knowledge_poc',
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || ''
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'NEO4J_URI',
  'NEO4J_PASSWORD',
  'OPENAI_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}