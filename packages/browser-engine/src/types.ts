export type BrowserActionType = 'goto' | 'click' | 'fill' | 'extract' | 'evaluate' | 'screenshot';

export interface BrowserAction {
  type: BrowserActionType;
  url?: string;
  selector?: string;
  value?: string;
  script?: string;
}

export interface BrowserSessionConfig {
  sessionId: string;
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
}

export interface BrowserActionResult {
  action: BrowserActionType;
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
