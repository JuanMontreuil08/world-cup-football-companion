import { fetchEspnCommentary } from '@/lib/espn-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') ?? process.env.ESPN_EVENT_ID;
  const league = process.env.ESPN_LEAGUE ?? 'fifa.world';

  if (!eventId) {
    return Response.json({ error: 'ESPN_EVENT_ID not configured' }, { status: 503 });
  }

  const fromMinute = searchParams.has('from') ? Number(searchParams.get('from')) : null;
  const toMinute = searchParams.has('to') ? Number(searchParams.get('to')) : null;

  try {
    const commentary = await fetchEspnCommentary(league, eventId);

    if (fromMinute !== null || toMinute !== null) {
      // time.value is seconds, convert minutes to seconds for comparison
      const fromSec = fromMinute !== null ? fromMinute * 60 : 0;
      const toSec = toMinute !== null ? toMinute * 60 : Infinity;
      const filtered = commentary.filter((e) => {
        const sec = e.time?.value ?? 0;
        return sec >= fromSec && sec <= toSec;
      });
      return Response.json(filtered);
    }

    // No range — return all entries so the feed shows the full match from minute 1
    return Response.json(commentary);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
