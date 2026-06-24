import { BrowserManager } from '@/lib/cua/browser';
import { searchAndPlayClip } from '@/lib/cua/youtube';

let browserInstance: BrowserManager | null = null;
let cuaAbort: AbortController | null = null;

async function getBrowser(): Promise<BrowserManager> {
  if (browserInstance?.isAlive()) return browserInstance;
  browserInstance = new BrowserManager();
  await browserInstance.launch();
  return browserInstance;
}

export async function POST(req: Request) {
  const { query, action } = await req.json();

  if (action === 'stop' || action === 'close') {
    console.log(`[cua] ${action} requested — browserInstance alive: ${browserInstance?.isAlive()}`);

    // Abort any running CUA loop first
    if (cuaAbort) {
      cuaAbort.abort();
      cuaAbort = null;
    }

    if (!browserInstance?.isAlive()) {
      console.log('[cua] no active browser to stop');
      return Response.json({ status: 'no_video' });
    }

    // Small delay to let the loop exit before we touch the page
    await new Promise(r => setTimeout(r, 300));

    try {
      const paused = await browserInstance.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        videos.forEach(v => v.pause());
        return videos.length;
      });
      console.log(`[cua] ⏹ Paused ${paused} video(s)`);
    } catch (err) {
      console.error('[cua] pause error:', err);
    }

    if (action === 'close') {
      await browserInstance.close();
      browserInstance = null;
      console.log('[cua] 🔴 Browser closed');
      return Response.json({ status: 'closed' });
    }

    return Response.json({ status: 'stopped' });
  }

  // Deduplicate: if a CUA search is already running, ignore the new request
  if (cuaAbort) {
    console.log('[cua] already running — ignoring duplicate openGoalClip call');
    return Response.json({ status: 'already_running' });
  }

  const browser = await getBrowser();
  cuaAbort = new AbortController();
  const signal = cuaAbort.signal;

  // Fire-and-forget — CUA takes 30-60s
  searchAndPlayClip(browser, query, signal).catch(err => {
    if (!signal.aborted) console.error('[cua] ❌', err);
  }).finally(() => { cuaAbort = null; });

  return Response.json({ status: 'searching', query });
}
