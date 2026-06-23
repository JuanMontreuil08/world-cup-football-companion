import { BrowserManager } from '@/lib/cua/browser';
import { navigateToMatch } from '@/lib/cua/paramount';

// Singleton — reuse browser across calls (stays logged in)
let browserInstance: BrowserManager | null = null;

async function getBrowser(): Promise<BrowserManager> {
  if (browserInstance?.isAlive()) return browserInstance;
  browserInstance = new BrowserManager();
  await browserInstance.launch();
  return browserInstance;
}

export async function POST(req: Request) {
  const { homeTeam, awayTeam, minute } = await req.json();
  const email = process.env.PARAMOUNT_EMAIL!;
  const password = process.env.PARAMOUNT_PASSWORD!;

  const browser = await getBrowser();

  try {
    const result = await navigateToMatch(browser, email, password, homeTeam, awayTeam, minute);
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { status: 'error', error: String(err) },
      { status: 500 },
    );
  }
  // Browser stays open — user is watching the stream
}
