import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { BrowserAction, BrowserActionResult, BrowserSessionConfig } from './types.js';

export class BrowserController {
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();
  private pages: Map<string, Page> = new Map();

  public async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
  }

  public async createSession(config: BrowserSessionConfig): Promise<string> {
    await this.initialize();
    if (!this.browser) throw new Error('Browser failed to initialize');

    const context = await this.browser.newContext({
      viewport: config.viewport ?? { width: 1280, height: 720 },
      userAgent: config.userAgent,
    });

    const page = await context.newPage();
    this.contexts.set(config.sessionId, context);
    this.pages.set(config.sessionId, page);

    return config.sessionId;
  }

  public async executeAction(sessionId: string, action: BrowserAction): Promise<BrowserActionResult> {
    const page = this.pages.get(sessionId);
    if (!page) {
      return {
        action: action.type,
        success: false,
        error: `Active browser session '${sessionId}' not found.`,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      let data: unknown = undefined;

      switch (action.type) {
        case 'goto':
          if (!action.url) throw new Error("URL is required for 'goto' action");
          await page.goto(action.url, { waitUntil: 'domcontentloaded' });
          data = { title: await page.title(), url: page.url() };
          break;

        case 'click':
          if (!action.selector) throw new Error("Selector is required for 'click' action");
          await page.click(action.selector, { timeout: 5000 });
          data = { clicked: action.selector };
          break;

        case 'fill':
          if (!action.selector || action.value === undefined) {
            throw new Error("Selector and value are required for 'fill' action");
          }
          await page.fill(action.selector, action.value, { timeout: 5000 });
          data = { filled: action.selector, value: action.value };
          break;

        case 'extract':
          if (!action.selector) throw new Error("Selector is required for 'extract' action");
          data = await page.innerText(action.selector);
          break;

        case 'evaluate':
          if (!action.script) throw new Error("Script is required for 'evaluate' action");
          data = await page.evaluate(action.script);
          break;

        case 'screenshot':
          const buffer = await page.screenshot({ type: 'png' });
          data = { base64: buffer.toString('base64') };
          break;
      }

      return {
        action: action.type,
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        action: action.type,
        success: false,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async closeSession(sessionId: string): Promise<void> {
    const context = this.contexts.get(sessionId);
    if (context) {
      await context.close();
      this.contexts.delete(sessionId);
      this.pages.delete(sessionId);
    }
  }

  public async shutdown(): Promise<void> {
    for (const [id] of this.contexts) {
      await this.closeSession(id);
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
