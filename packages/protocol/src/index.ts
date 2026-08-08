export interface StreamEnvelope {
  event: 'connected' | 'workflow.started' | 'workflow.step.started' | 'workflow.step.completed' | 'workflow.step.failed' | 'workflow.completed' | 'server-complete';
  runId: string;
  stepId?: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface ExtensionMessage {
  id: string;
  type: 'EXECUTE_DOM_ACTION' | 'SYNC_WORKFLOW_STATE' | 'QUERY_DOM_SELECTOR';
  payload: Record<string, unknown>;
}

export interface ExtensionResponse {
  status: 'success' | 'error';
  correlationId: string;
  payload?: unknown;
  error?: string;
}
