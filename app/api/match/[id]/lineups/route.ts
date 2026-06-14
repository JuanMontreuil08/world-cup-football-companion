import { footballFetch } from '@/lib/football-api';
import { Lineup } from '@/types/football';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const lineups = await footballFetch<Lineup[]>(`/fixtures/lineups?fixture=${id}`, 10);
    return Response.json(lineups);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
