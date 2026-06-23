import { BrowserManager } from './browser';
import { cuaLoop } from './engine';

export async function navigateToMatch(
  browser: BrowserManager,
  email: string,
  password: string,
  homeTeam: string,
  awayTeam: string,
  minute?: number,
): Promise<{ status: string; minute?: number }> {
  // Step 1: Open Paramount+
  console.log('[paramount] Step 1: Opening paramountplus.com');
  await browser.goto('https://www.paramountplus.com');

  // Step 2: Login — pure Playwright, no CUA (CUA keeps typing fake credentials)
  console.log('[paramount] Step 2: Clicking INICIAR SESIÓN');
  await browser.clickText('INICIAR SESIÓN');
  await browser.waitForNavigation();

  console.log('[paramount] Step 2b: Filling credentials (Playwright only, not sent to any AI)');
  await browser.fillInput('input[type="email"], input[name="email"], #email', email);
  await browser.fillInput('input[type="password"], input[name="password"], #password', password);

  console.log('[paramount] Step 2c: Submitting login');
  await browser.pressEnter();
  await browser.waitForNavigation();

  // Step 3: Navigate to World Cup page and find the match — CUA shines here
  console.log(`[paramount] Step 3: Finding match — ${homeTeam} vs ${awayTeam}`);
  await cuaLoop(
    browser,
    `Navigate to "COPA MUNDIAL DE LA FIFA" in the top nav, then find and click the match: ${homeTeam} vs ${awayTeam}.`,
    'Click "COPA MUNDIAL DE LA FIFA" in the navigation bar. On that page, look for the match card with both team flags. Live matches have a red "EN VIVO" badge.',
  );

  // Step 4: Match interstitial — choose live or from beginning
  if (minute !== undefined) {
    console.log(`[paramount] Step 4: Clicking "COMENZAR DESDE EL PRINCIPIO" to seek to min ${minute}`);
    await cuaLoop(
      browser,
      'Click the "COMENZAR DESDE EL PRINCIPIO" button.',
      'There are two buttons: "EN VIVO" (live) and "COMENZAR DESDE EL PRINCIPIO" (from beginning). Click the second one so we can seek to a specific minute.',
    );

    // Step 5: Seek to the target minute
    console.log(`[paramount] Step 5: Seeking to minute ${minute}`);
    await cuaLoop(
      browser,
      `Seek the video to minute ${minute} of the match.`,
      'Click on the video to focus it. Use arrow keys to step through time, or click on the progress bar to jump near the target minute. Check the time indicator after each action.',
    );
  } else {
    console.log('[paramount] Step 4: Clicking "EN VIVO" for live stream');
    await cuaLoop(
      browser,
      'Click the blue "EN VIVO" button to start watching the live stream.',
      'There are two buttons. Click the blue "EN VIVO" button at the top to join the live broadcast.',
    );
  }

  console.log('[paramount] ✅ Navigation complete');
  return { status: 'playing', ...(minute !== undefined && { minute }) };
}
