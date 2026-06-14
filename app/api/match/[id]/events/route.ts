import { footballFetch } from '@/lib/football-api';
import { MatchEvent } from '@/types/football';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const events = await footballFetch<MatchEvent[]>(`/fixtures/events?fixture=${id}`, 10);
    return Response.json(events);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
