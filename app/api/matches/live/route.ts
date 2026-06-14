import { footballFetch } from '@/lib/football-api';
import { LiveMatch } from '@/types/football';

export async function GET() {
  try {
    const matches = await footballFetch<LiveMatch[]>('/fixtures?live=all', 30);
    return Response.json(matches);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
