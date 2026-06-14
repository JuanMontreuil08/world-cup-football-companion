'use server';

import { REALTIME_MODEL, VOICE } from '@/lib/config';

export async function getEphemeralKey(): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const res = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        type: 'realtime',
        model: REALTIME_MODEL,
        audio: { output: { voice: VOICE } },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI session error ${res.status}: ${err}`);
  }

  const data = await res.json();
  // Try both possible response shapes
  return (data.value ?? data.client_secret?.value) as string;
}
