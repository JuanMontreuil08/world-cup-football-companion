import { chromium, Browser, BrowserContext, Page } from 'playwright';

export type CUAAction =
  | { type: 'click'; x: number; y: number; button: string; keys?: string[] | null }
  | { type: 'double_click'; x: number; y: number; keys?: string[] | null }
  | { type: 'type'; text: string }
  | { type: 'keypress'; keys: string[] }
  | { type: 'move'; x: number; y: number }
  | { type: 'scroll'; x: number; y: number; scroll_x: number; scroll_y: number }
  | { type: 'drag'; path: { x: number; y: number }[] }
  | { type: 'wait' }
  | { type: 'screenshot' };

const KEY_MAP: Record<string, string> = {
  ENTER: 'Enter', RETURN: 'Enter', SPACE: 'Space', TAB: 'Tab',
  BACKSPACE: 'Backspace', DELETE: 'Delete', ESCAPE: 'Escape',
  ARROWUP: 'ArrowUp', ARROWDOWN: 'ArrowDown',
  ARROWLEFT: 'ArrowLeft', ARROWRIGHT: 'ArrowRight',
  UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight',
  CMD: 'Meta', CTRL: 'Control', ALT: 'Alt', SHIFT: 'Shift',
};

function normalizeKey(key: string): string {
  return KEY_MAP[key.toUpperCase()] ?? key;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async launch(): Promise<void> {
    this.browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      args: ['--disable-blink-features=AutomationControlled'],
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    this.page = await this.context.newPage();
  }

  isAlive(): boolean {
    return this.browser?.isConnected() === true && this.page !== null && !this.page.isClosed();
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async goto(url: string): Promise<void> {
    await this.page!.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async screenshot(): Promise<string> {
    const buf = await this.page!.screenshot({ type: 'png' });
    return `data:image/png;base64,${buf.toString('base64')}`;
  }

  async pressEnter(): Promise<void> {
    await this.page!.keyboard.press('Enter');
  }

  async waitForNavigation(): Promise<void> {
    await this.page!.waitForLoadState('domcontentloaded');
  }

  async evaluate<T>(fn: (arg?: unknown) => T, arg?: unknown): Promise<T> {
    return this.page!.evaluate(fn, arg) as Promise<T>;
  }

  async executeActions(actions: CUAAction[]): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          await this.page!.mouse.click(action.x, action.y, { button: (action.button ?? 'left') as 'left' | 'right' | 'middle' });
          break;
        case 'double_click':
          await this.page!.mouse.dblclick(action.x, action.y);
          break;
        case 'type':
          await this.page!.keyboard.type(action.text);
          break;
        case 'keypress':
          for (const key of action.keys) {
            await this.page!.keyboard.press(normalizeKey(key));
          }
          break;
        case 'move':
          await this.page!.mouse.move(action.x, action.y);
          break;
        case 'scroll':
          await this.page!.mouse.move(action.x, action.y);
          await this.page!.mouse.wheel(action.scroll_x, action.scroll_y);
          break;
        case 'drag': {
          const [start, ...rest] = action.path;
          await this.page!.mouse.move(start.x, start.y);
          await this.page!.mouse.down();
          for (const pt of rest) await this.page!.mouse.move(pt.x, pt.y);
          await this.page!.mouse.up();
          break;
        }
        case 'wait':
          await new Promise(r => setTimeout(r, 1000));
          break;
        case 'screenshot':
          break; // no-op — screenshot is taken after all actions
      }
    }
  }
}
