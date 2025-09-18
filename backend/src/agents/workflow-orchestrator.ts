import { WorkflowExecution, AgentStep } from '@knowledge-poc/shared';
import { BaseAgent, AgentInput, AgentOutput } from './base-agent';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowConfig {
  agents: BaseAgent[];
  parallel?: boolean;
  stopOnError?: boolean;
  maxExecutionTime?: number;
}

export class WorkflowOrchestrator {
  private executions: Map<string, WorkflowExecution> = new Map();

  /**
   * Execute a workflow with the given agents
   */
  async executeWorkflow(
    agents: BaseAgent[],
    initialData: any,
    config: Partial<WorkflowConfig> = {}
  ): Promise<WorkflowExecution> {
    const workflowId = uuidv4();
    const execution: WorkflowExecution = {
      id: workflowId,
      documentId: initialData.documentId || 'unknown',
      steps: [],
      status: 'running',
      startTime: new Date().toISOString(),
    };

    this.executions.set(workflowId, execution);

    try {
      console.log(`🔄 Starting workflow ${workflowId} with ${agents.length} agents`);

      let currentData = initialData;
      const results: AgentOutput[] = [];

      if (config.parallel) {
        // Execute agents in parallel
        results.push(...await this.executeParallel(agents, currentData, workflowId));
      } else {
        // Execute agents sequentially
        for (const agent of agents) {
          const agentInput: AgentInput = {
            data: currentData,
            context: { previousResults: results },
            workflowId
          };

          try {
            console.log(`🤖 Executing agent: ${agent.name}`);
            const startTime = new Date();
            
            const output = await agent.execute(agentInput);
            
            const step: AgentStep = {
              agentName: agent.name,
              action: 'execute',
              input: agentInput,
              output: output,
              timestamp: new Date().toISOString(),
              duration: new Date().getTime() - startTime.getTime(),
              success: true
            };

            execution.steps.push(step);
            results.push(output);

            // Use agent output as input for next agent
            if (output.result) {
              currentData = { ...currentData, ...output.result };
            }

            console.log(`✅ Agent ${agent.name} completed successfully`);

          } catch (error: any) {
            console.error(`❌ Agent ${agent.name} failed:`, error);

            const errorStep: AgentStep = {
              agentName: agent.name,
              action: 'execute',
              input: agentInput,
              output: null,
              timestamp: new Date().toISOString(),
              duration: 0,
              success: false,
              error: error.message
            };

            execution.steps.push(errorStep);

            if (config.stopOnError) {
              throw error;
            }
          }
        }
      }

      // Workflow completed successfully
      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      execution.totalDuration = new Date().getTime() - new Date(execution.startTime).getTime();

      console.log(`✅ Workflow ${workflowId} completed in ${execution.totalDuration}ms`);
      return execution;

    } catch (error: any) {
      console.error(`❌ Workflow ${workflowId} failed:`, error);
      
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      execution.totalDuration = new Date().getTime() - new Date(execution.startTime).getTime();

      return execution;
    }
  }

  /**
   * Execute agents in parallel
   */
  private async executeParallel(
    agents: BaseAgent[], 
    data: any, 
    workflowId: string
  ): Promise<AgentOutput[]> {
    const promises = agents.map(async (agent) => {
      const agentInput: AgentInput = {
        data,
        workflowId
      };

      try {
        console.log(`🤖 Executing agent: ${agent.name} (parallel)`);
        const startTime = new Date();
        const output = await agent.execute(agentInput);
        
        const step: AgentStep = {
          agentName: agent.name,
          action: 'execute',
          input: agentInput,
          output: output,
          timestamp: new Date().toISOString(),
          duration: new Date().getTime() - startTime.getTime(),
          success: true
        };

        const execution = this.executions.get(workflowId);
        if (execution) {
          execution.steps.push(step);
        }

        console.log(`✅ Agent ${agent.name} completed (parallel)`);
        return output;

      } catch (error: any) {
        console.error(`❌ Agent ${agent.name} failed (parallel):`, error);
        
        const errorStep: AgentStep = {
          agentName: agent.name,
          action: 'execute',
          input: agentInput,
          output: null,
          timestamp: new Date().toISOString(),
          duration: 0,
          success: false,
          error: error.message
        };

        const execution = this.executions.get(workflowId);
        if (execution) {
          execution.steps.push(errorStep);
        }

        // Return null output but don't fail the entire workflow
        return {
          result: null,
          confidence: 0,
          metadata: { error: error.message }
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Get workflow execution status
   */
  getExecution(workflowId: string): WorkflowExecution | undefined {
    return this.executions.get(workflowId);
  }

  /**
   * Get all executions for a document
   */
  getDocumentExecutions(documentId: string): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(
      execution => execution.documentId === documentId
    );
  }

  /**
   * Clean up old executions (call periodically)
   */
  cleanup(olderThanHours: number = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - olderThanHours);

    for (const [id, execution] of this.executions.entries()) {
      const executionTime = new Date(execution.startTime);
      if (executionTime < cutoff) {
        this.executions.delete(id);
      }
    }

    console.log(`🧹 Cleaned up old workflow executions`);
  }
}