export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return Response.json({ error: 'Missing query' }, { status: 400 });

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return Response.json({ error: 'PERPLEXITY_API_KEY not set' }, { status: 500 });

  const res = await fetch('https://api.perplexity.ai/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: q,
      max_results: 5,
      search_context_size: 'high',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  // Return snippets joined as text so the agent can read it naturally
  const text = (data.results ?? [])
    .map((r: { title: string; snippet: string }) => `${r.title}: ${r.snippet}`)
    .join('\n\n');

  return Response.json({ text });
}
