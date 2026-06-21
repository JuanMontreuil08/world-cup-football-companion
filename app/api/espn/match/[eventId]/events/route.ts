const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const res = await fetch(`${ESPN_BASE}/summary?event=${eventId}`, { next: { revalidate: 10 } })
  if (!res.ok) return Response.json({ error: 'ESPN error' }, { status: res.status })

  const data = await res.json()
  const keyEvents: {
    id: string
    type?: { text?: string; type?: string }
    text?: string
    shortText?: string
    clock?: { displayValue?: string; value?: number }
    period?: { number?: number }
    scoringPlay?: boolean
    team?: { displayName?: string }
    participants?: { athlete?: { displayName?: string } }[]
  }[] = data.keyEvents ?? []

  const normalized = keyEvents
    .filter(e => e.type?.type !== 'kickoff' && e.type?.type !== 'start-delay')
    .map(e => ({
      id: e.id,
      type: e.type?.text ?? '',
      typeKey: e.type?.type ?? '',
      text: e.text ?? e.shortText ?? '',
      minute: e.clock?.displayValue ?? '',
      minuteValue: e.clock?.value ?? 0,
      period: e.period?.number ?? 1,
      scoringPlay: e.scoringPlay ?? false,
      team: e.team?.displayName ?? '',
      player: e.participants?.[0]?.athlete?.displayName ?? '',
    }))
    .sort((a, b) => a.minuteValue - b.minuteValue)

  return Response.json(normalized)
}
