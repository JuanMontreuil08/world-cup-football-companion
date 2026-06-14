const BASE_URL = 'https://v3.football.api-sports.io';

function headers() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('API_FOOTBALL_KEY is not set');
  return {
    'x-rapidapi-key': key,
    'x-rapidapi-host': 'v3.football.api-sports.io',
  };
}

export async function footballFetch<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: headers(),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}: ${path}`);
  const json = await res.json();
  return json.response as T;
}
