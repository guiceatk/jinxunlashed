import { WorkflowNode, StepResult } from './types.js';

export type AgentLoopState = 'analyze' | 'plan' | 'execute' | 'observe' | 'completed' | 'failed';

export interface AgentContextWindow {
  messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }>;
  tokenCountEstimate: number;
  kvCachePrefixHash: string;
}

export interface ConstrainedToolMask {
  allowedToolIds: string[];
  logitBias: Record<string, number>;
}

export class AgentLoopOrchestrator {
  private state: AgentLoopState = 'analyze';
  private maxIterations: number;
  private currentIteration: number = 0;

  constructor(maxIterations: number = 10) {
    this.maxIterations = maxIterations;
  }

  public getState(): AgentLoopState {
    return this.state;
  }

  // Token Logit Masking: Constrain model tool selection to valid schema nodes
  public generateToolMask(availableNodes: WorkflowNode[]): ConstrainedToolMask {
    const allowedToolIds = availableNodes.map(n => n.id);
    const logitBias: Record<string, number> = {};

    for (const toolId of allowedToolIds) {
      logitBias[toolId] = 100.0; // Boost logits for valid candidate tools
    }

    return { allowedToolIds, logitBias };
  }

  // Context Engineering & KV-Cache Optimization (sliding window + prefix immutability)
  public optimizeContextWindow(context: AgentContextWindow, maxTokens: number = 4096): AgentContextWindow {
    let currentTokens = context.tokenCountEstimate;
    const messages = [...context.messages];

    // Preserve system prompt (prefix) for KV-cache reuse, prune oldest intermediate messages
    while (currentTokens > maxTokens && messages.length > 2) {
      const removed = messages.splice(1, 1)[0];
      currentTokens -= Math.ceil(removed.content.length / 4);
    }

    return {
      messages,
      tokenCountEstimate: currentTokens,
      kvCachePrefixHash: context.kvCachePrefixHash,
    };
  }

  // Core Iterative Loop Step
  public async stepLoop(
    analyzeFn: () => Promise<string>,
    planFn: (analysis: string) => Promise<WorkflowNode[]>,
    executeFn: (plan: WorkflowNode[]) => Promise<StepResult[]>,
    observeFn: (results: StepResult[]) => Promise<boolean>
  ): Promise<{ state: AgentLoopState; iteration: number }> {
    while (this.currentIteration < this.maxIterations && this.state !== 'completed' && this.state !== 'failed') {
      this.currentIteration++;

      // 1. Analyze
      this.state = 'analyze';
      const analysis = await analyzeFn();

      // 2. Plan
      this.state = 'plan';
      const plan = await planFn(analysis);

      // 3. Execute
      this.state = 'execute';
      const results = await executeFn(plan);

      // 4. Observe
      this.state = 'observe';
      const isFinished = await observeFn(results);

      if (isFinished) {
        this.state = 'completed';
        break;
      }
    }

    if (this.currentIteration >= this.maxIterations && this.state !== 'completed') {
      this.state = 'failed';
    }

    return { state: this.state, iteration: this.currentIteration };
  }
}
