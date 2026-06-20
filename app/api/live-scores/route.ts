// Returns only live match fields (id, score, clock, state) — polled every ~30s by the schedule
export async function GET() {
  const today = new Date(Date.now() - 5 * 60 * 60 * 1000)
    .toISOString().slice(0, 10).replace(/-/g, '')

  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=100&dates=${today}-20260628`,
    { next: { revalidate: 0 } }  // always fresh
  )
  if (!res.ok) return Response.json([], { status: res.status })

  const data = await res.json()
  const events: {
    id: string
    competitions: [{
      status: { displayClock: string; type: { state: string } }
      competitors: { homeAway: string; score: string }[]
    }]
  }[] = data.events ?? []

  const live = events
    .filter(e => e.competitions[0].status.type.state === 'in')
    .map(e => {
      const comp = e.competitions[0]
      const home = comp.competitors.find(c => c.homeAway === 'home')
      const away = comp.competitors.find(c => c.homeAway === 'away')
      return {
        id: e.id,
        state: comp.status.type.state,
        clock: comp.status.displayClock,
        homeScore: home?.score ?? '0',
        awayScore: away?.score ?? '0',
      }
    })

  return Response.json(live)
}
