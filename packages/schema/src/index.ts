import { z } from 'zod';

export const StepTypeSchema = z.enum([
  'trigger.manual',
  'trigger.webhook',
  'browser.navigate',
  'browser.click',
  'browser.extract_text',
  'model.prompt',
  'logic.condition',
  'artifact.save',
]);

export type StepType = z.infer<typeof StepTypeSchema>;

export const WorkflowStepSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: StepTypeSchema,
  dependsOn: z.array(z.string().uuid()).default([]),
  config: z.record(z.any()),
  retryPolicy: z
    .object({
      maxAttempts: z.number().default(3),
      backoffMs: z.number().default(1000),
    })
    .default({ maxAttempts: 3, backoffMs: 1000 }),
  timeoutMs: z.number().default(30000),
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

export const WorkflowGraphSchema = z.object({
  workflowId: z.string().uuid(),
  version: z.number().int().positive(),
  nodes: z.array(WorkflowStepSchema),
  environmentVariables: z.record(z.string()).default({}),
});

export type WorkflowGraph = z.infer<typeof WorkflowGraphSchema>;
