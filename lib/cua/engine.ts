import OpenAI from 'openai';
import { BrowserManager, CUAAction } from './browser';

const client = new OpenAI();

const CUA_MODEL = 'gpt-5.5';
const MAX_ITERATIONS = 20;

export async function cuaLoop(
  browser: BrowserManager,
  goal: string,
  hints: string,
  signal?: AbortSignal,
): Promise<void> {
  console.log(`[cua] 🎯 Goal: ${goal}`);

  let response = await client.responses.create({
    model: CUA_MODEL,
    tools: [{ type: 'computer' }],
    input: [{ role: 'user', content: `${goal}\n\nContext: ${hints}` }],
  });

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (signal?.aborted) {
      console.log('[cua] 🛑 Aborted');
      break;
    }

    const computerCall = response.output.find(
      (o: { type: string }) => o.type === 'computer_call'
    ) as { type: 'computer_call'; call_id: string; actions?: CUAAction[] } | undefined;

    if (!computerCall) {
      console.log(`[cua] ✅ Done after ${i} iterations`);
      break;
    }

    const actionTypes = computerCall.actions?.map(a => a.type).join(', ') ?? 'none';
    console.log(`[cua] ⚡ Iteration ${i + 1} — [${actionTypes}]`);

    if (computerCall.actions?.length) {
      await browser.executeActions(computerCall.actions);
    }

    const screenshot = await browser.screenshot();

    response = await client.responses.create({
      model: CUA_MODEL,
      tools: [{ type: 'computer' }],
      previous_response_id: response.id,
      input: [{
        type: 'computer_call_output' as const,
        call_id: computerCall.call_id,
        output: {
          type: 'computer_screenshot' as const,
          image_url: screenshot,
        },
      }],
    });
  }
}
