import { footballFetch } from '@/lib/football-api';
import { MatchStat } from '@/types/football';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const stats = await footballFetch<MatchStat[]>(`/fixtures/statistics?fixture=${id}`, 10);
    return Response.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
