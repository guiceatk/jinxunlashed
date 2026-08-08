import { z } from 'zod';

export type NodeType = 'browser' | 'model' | 'filter' | 'transform' | 'webhook';

export interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  config: Record<string, unknown>;
  dependsOn?: string[];
}

export interface WorkflowGraph {
  id: string;
  name: string;
  nodes: WorkflowNode[];
}

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

export interface StepResult {
  nodeId: string;
  status: StepStatus;
  output?: unknown;
  error?: string;
  durationMs: number;
  attempts: number;
}

export interface StreamEventEnvelope {
  event: 'workflow.started' | 'workflow.step.started' | 'workflow.step.completed' | 'workflow.step.failed' | 'workflow.completed';
  runId: string;
  stepId?: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['browser', 'model', 'filter', 'transform', 'webhook']),
  config: z.record(z.unknown()),
  dependsOn: z.array(z.string()).optional(),
});

export const WorkflowGraphSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(WorkflowNodeSchema),
});
