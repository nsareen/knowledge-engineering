import { AgentStep, WorkflowExecution } from '@knowledge-poc/shared';

export interface AgentInput {
  data: any;
  context?: Record<string, any>;
  workflowId: string;
}

export interface AgentOutput {
  result: any;
  confidence: number;
  metadata?: Record<string, any>;
  citations?: Array<{ source: string; page?: number }>;
}

export abstract class BaseAgent {
  public readonly name: string;
  public readonly description: string;
  
  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  /**
   * Execute the agent's primary function
   */
  abstract execute(input: AgentInput): Promise<AgentOutput>;

  /**
   * Validate input before execution
   */
  protected validateInput(input: AgentInput): boolean {
    return input && input.data !== undefined && input.workflowId;
  }

  /**
   * Create an agent step for tracking
   */
  protected createStep(
    action: string, 
    input: any, 
    output: any, 
    success: boolean, 
    error?: string,
    startTime?: Date
  ): AgentStep {
    const endTime = new Date();
    const start = startTime || endTime;
    
    return {
      agentName: this.name,
      action,
      input,
      output,
      timestamp: endTime.toISOString(),
      duration: endTime.getTime() - start.getTime(),
      success,
      error
    };
  }

  /**
   * Log agent execution
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.name}]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️ ${message}`);
        break;
      default:
        console.log(`${prefix} ℹ️ ${message}`);
    }
  }
}

export interface AgentConfig {
  maxRetries?: number;
  timeoutMs?: number;
  enableCache?: boolean;
}