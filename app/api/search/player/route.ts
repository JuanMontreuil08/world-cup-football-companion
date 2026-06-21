export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return Response.json({ error: 'Missing query' }, { status: 400 });

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return Response.json({ error: 'PERPLEXITY_API_KEY not set' }, { status: 500 });

  const res = await fetch('https://api.perplexity.ai/v1/sonar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: q }],
      search_recency_filter: 'month',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  return Response.json({ text });
}
