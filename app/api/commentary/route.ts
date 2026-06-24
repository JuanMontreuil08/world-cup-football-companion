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

    // No range — return a condensed summary: key events + one entry per 5-min window
    // Prevents overloading the realtime model with 100+ commentary lines
    const KEY_TYPES = ['goal', 'card', 'substitution', 'penalty', 'red card', 'yellow card'];
    const isKeyEvent = (e: typeof commentary[0]) => {
      const type = e.play?.type?.type?.toLowerCase() ?? '';
      const text = e.text?.toLowerCase() ?? '';
      return KEY_TYPES.some(k => type.includes(k) || text.includes(k));
    };

    const seen = new Set<number>();
    const condensed = commentary.filter(e => {
      if (isKeyEvent(e)) return true;
      const bucket = Math.floor((e.time?.value ?? 0) / 300); // 5-min buckets
      if (seen.has(bucket)) return false;
      seen.add(bucket);
      return true;
    });

    return Response.json(condensed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
