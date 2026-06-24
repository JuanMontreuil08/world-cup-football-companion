import { BrowserManager } from './browser';
import { cuaLoop } from './engine';

export async function searchAndPlayClip(
  browser: BrowserManager,
  query: string,
  signal?: AbortSignal,
): Promise<{ status: string; query: string }> {
  console.log(`[youtube] 🎯 Searching: ${query}`);

  await browser.goto('https://www.youtube.com');

  await cuaLoop(
    browser,
    `Search YouTube for "${query}" and play the best matching video.`,
    `1. Click the search bar. 2. Type the query. 3. Press Enter. 4. Click the most relevant result — prefer official channels or match highlight clips. 5. Once the video is playing, you're done. If a cookie consent banner appears, dismiss it first.`,
    signal,
  );

  console.log('[youtube] ✅ Playing');
  return { status: 'playing', query };
}
