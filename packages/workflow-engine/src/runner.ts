import PQueue from 'p-queue';
import { WorkflowGraph, WorkflowNode, StepResult, StreamEventEnvelope } from './types.js';

export type NodeExecutor = (node: WorkflowNode, context: Record<string, unknown>) => Promise<unknown>;

export interface WorkflowRunnerOptions {
  concurrency?: number;
  maxRetries?: number;
  retryBackoffMs?: number;
  onEvent?: (event: StreamEventEnvelope) => void;
}

export class WorkflowRunner {
  private queue: PQueue;
  private maxRetries: number;
  private retryBackoffMs: number;
  private onEvent?: (event: StreamEventEnvelope) => void;

  constructor(options: WorkflowRunnerOptions = {}) {
    this.queue = new PQueue({ concurrency: options.concurrency ?? 1 });
    this.maxRetries = options.maxRetries ?? 2;
    this.retryBackoffMs = options.retryBackoffMs ?? 1000;
    this.onEvent = options.onEvent;
  }

  public async execute(
    graph: WorkflowGraph,
    executor: NodeExecutor,
    initialContext: Record<string, unknown> = {}
  ): Promise<{ runId: string; results: Record<string, StepResult>; context: Record<string, unknown> }> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const results: Record<string, StepResult> = {};
    const context: Record<string, unknown> = { ...initialContext };

    this.emitEvent({
      event: 'workflow.started',
      runId,
      timestamp: new Date().toISOString(),
      payload: { graphId: graph.id, nodeCount: graph.nodes.length },
    });

    const executed = new Set<string>();
    const nodeMap = new Map<string, WorkflowNode>(graph.nodes.map(n => [n.id, n]));

    while (executed.size < graph.nodes.length) {
      const readyNodes = graph.nodes.filter(node => {
        if (executed.has(node.id)) return false;
        if (!node.dependsOn || node.dependsOn.length === 0) return true;
        return node.dependsOn.every(depId => executed.has(depId) && results[depId]?.status === 'completed');
      });

      if (readyNodes.length === 0 && executed.size < graph.nodes.length) {
        throw new Error('Cyclic dependency or unresolvable node execution order detected in workflow graph.');
      }

      await Promise.all(
        readyNodes.map(node =>
          this.queue.add(async () => {
            const startTime = Date.now();
            let attempts = 0;
            let success = false;
            let lastError: Error | null = null;
            let output: unknown = undefined;

            this.emitEvent({
              event: 'workflow.step.started',
              runId,
              stepId: node.id,
              timestamp: new Date().toISOString(),
              payload: { nodeName: node.name, type: node.type },
            });

            while (attempts <= this.maxRetries && !success) {
              attempts++;
              try {
                output = await executor(node, context);
                success = true;
              } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                if (attempts <= this.maxRetries) {
                  await new Promise(res => setTimeout(res, this.retryBackoffMs * attempts));
                }
              }
            }

            const durationMs = Date.now() - startTime;

            if (success) {
              results[node.id] = {
                nodeId: node.id,
                status: 'completed',
                output,
                durationMs,
                attempts,
              };
              context[node.id] = output;
              executed.add(node.id);

              this.emitEvent({
                event: 'workflow.step.completed',
                runId,
                stepId: node.id,
                timestamp: new Date().toISOString(),
                payload: { durationMs, attempts, output },
              });
            } else {
              results[node.id] = {
                nodeId: node.id,
                status: 'failed',
                error: lastError?.message ?? 'Unknown execution failure',
                durationMs,
                attempts,
              };
              executed.add(node.id);

              this.emitEvent({
                event: 'workflow.step.failed',
                runId,
                stepId: node.id,
                timestamp: new Date().toISOString(),
                payload: { durationMs, attempts, error: lastError?.message },
              });
            }
          })
        )
      );
    }

    this.emitEvent({
      event: 'workflow.completed',
      runId,
      timestamp: new Date().toISOString(),
      payload: { results },
    });

    return { runId, results, context };
  }

  private emitEvent(event: StreamEventEnvelope) {
    if (this.onEvent) {
      this.onEvent(event);
    }
  }
}
