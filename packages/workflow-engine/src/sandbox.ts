export interface VirtualFile {
  path: string;
  content: string;
  updatedAt: string;
}

export interface SandboxExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export class ExecutionSandbox {
  private vfs: Map<string, VirtualFile> = new Map();
  private containerId: string;

  constructor(containerId: string = `sandbox_${Date.now()}`) {
    this.containerId = containerId;
  }

  public getContainerId(): string {
    return this.containerId;
  }

  // Persistent Virtual File System
  public writeFile(path: string, content: string): void {
    this.vfs.set(path, {
      path,
      content,
      updatedAt: new Date().toISOString(),
    });
  }

  public readFile(path: string): VirtualFile | undefined {
    return this.vfs.get(path);
  }

  public listFiles(): VirtualFile[] {
    return Array.from(this.vfs.values());
  }

  // Code Interpreter / CLI Sandbox Runner (Node.js & Python simulation)
  public async executeCommand(
    runtime: 'node' | 'python' | 'bash',
    scriptOrCmd: string
  ): Promise<SandboxExecutionResult> {
    const startTime = Date.now();

    try {
      let stdout = '';
      if (runtime === 'node') {
        stdout = `[Node.js Sandbox Output]: Processed script successfully. (${scriptOrCmd.length} bytes)`;
      } else if (runtime === 'python') {
        stdout = `[Python 3.11 Sandbox Output]: Evaluated code block cleanly.`;
      } else {
        stdout = `[Ubuntu CLI Output]: Executed command "${scriptOrCmd}".`;
      }

      return {
        stdout,
        stderr: '',
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        exitCode: 1,
        durationMs: Date.now() - startTime,
      };
    }
  }
}
