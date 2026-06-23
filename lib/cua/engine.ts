import OpenAI from 'openai';
import { BrowserManager, CUAAction } from './browser';

const client = new OpenAI();

const CUA_MODEL = 'gpt-5.5';
const MAX_ITERATIONS = 20;

export async function cuaLoop(
  browser: BrowserManager,
  goal: string,
  hints: string,
): Promise<{ status: string; error?: string }> {
  console.log(`[cua] 🎯 Goal: ${goal}`);

  await browser.screenshot(); // warm up — first turn the model will request its own screenshot
  console.log('[cua] 📸 Initial screenshot taken');

  let response = await client.responses.create({
    model: CUA_MODEL,
    tools: [{ type: 'computer' }],
    input: [
      { role: 'user', content: `${goal}\n\nContext: ${hints}` },
    ],
  });
  console.log(`[cua] 🤖 First response — ${response.output.length} output items`);

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const computerCall = response.output.find(
      (o: { type: string }) => o.type === 'computer_call'
    ) as { type: 'computer_call'; call_id: string; actions?: CUAAction[] } | undefined;

    if (!computerCall) {
      console.log(`[cua] ✅ Done — model returned no more actions (iteration ${i})`);
      break;
    }

    const actionTypes = computerCall.actions?.map(a => a.type).join(', ') ?? 'none';
    console.log(`[cua] ⚡ Iteration ${i + 1} — actions: [${actionTypes}]`);

    if (computerCall.actions?.length) {
      await browser.executeActions(computerCall.actions);
    }

    const newScreenshot = await browser.screenshot();
    console.log(`[cua] 📸 Screenshot after actions`);

    response = await client.responses.create({
      model: CUA_MODEL,
      tools: [{ type: 'computer' }],
      previous_response_id: response.id,
      input: [{
        type: 'computer_call_output' as const,
        call_id: computerCall.call_id,
        output: {
          type: 'computer_screenshot' as const,
          image_url: newScreenshot,
        },
      }],
    });
    console.log(`[cua] 🤖 Response — ${response.output.length} output items`);
  }

  console.log(`[cua] ✅ cuaLoop complete for: ${goal}`);
  return { status: 'complete' };
}
