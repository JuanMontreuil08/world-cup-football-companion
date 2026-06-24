import { BrowserManager } from '@/lib/cua/browser';
import { searchAndPlayClip } from '@/lib/cua/youtube';

// Singleton — browser stays open between calls so CUA doesn't reload every time
let browserInstance: BrowserManager | null = null;

async function getBrowser(): Promise<BrowserManager> {
  if (browserInstance?.isAlive()) return browserInstance;
  browserInstance = new BrowserManager();
  await browserInstance.launch();
  return browserInstance;
}

export async function POST(req: Request) {
  const { query } = await req.json();
  const browser = await getBrowser();

  try {
    const result = await searchAndPlayClip(browser, query);
    return Response.json(result);
  } catch (err) {
    console.error('[cua] ❌', err);
    browserInstance = null;
    return Response.json({ status: 'error', error: String(err) }, { status: 500 });
  }
}
