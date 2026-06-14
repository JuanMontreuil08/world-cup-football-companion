import { footballFetch } from '@/lib/football-api';

interface PlayerEntry {
  player: { id: number; name: string };
  statistics: unknown[];
}

interface TeamPlayers {
  team: { id: number; name: string };
  players: PlayerEntry[];
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  try {
    const teams = await footballFetch<TeamPlayers[]>(`/fixtures/players?fixture=${id}`, 60);
    const playerId = Number(pid);
    for (const team of teams) {
      const entry = team.players.find((p) => p.player.id === playerId);
      if (entry) return Response.json({ team: team.team, ...entry });
    }
    return Response.json(null);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
