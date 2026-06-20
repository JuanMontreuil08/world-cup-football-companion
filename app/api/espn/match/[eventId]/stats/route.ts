const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const res = await fetch(`${ESPN_BASE}/summary?event=${eventId}`, { next: { revalidate: 30 } })
  if (!res.ok) return Response.json({ error: 'ESPN error' }, { status: res.status })

  const data = await res.json()
  const boxscore = data.boxscore

  if (!boxscore?.teams?.length) return Response.json([])

  // Each team has a statistics array; zip them into paired rows
  const [home, away] = boxscore.teams as {
    team: { displayName: string; logo?: string; logos?: { href: string }[] }
    statistics: { name: string; label?: string; displayName?: string; displayValue: string }[]
  }[]

  const homeLogo = home.team.logos?.[0]?.href ?? home.team.logo ?? ''
  const awayLogo = away.team.logos?.[0]?.href ?? away.team.logo ?? ''

  // ESPN uses 'label' in boxscore stats (not 'displayName')
  const statMap = new Map<string, { displayName: string; home: string; away: string }>()
  for (const s of home.statistics) {
    const label = s.label ?? s.displayName ?? s.name
    statMap.set(s.name, { displayName: label, home: s.displayValue, away: '' })
  }
  for (const s of away.statistics) {
    const label = s.label ?? s.displayName ?? s.name
    const existing = statMap.get(s.name)
    if (existing) existing.away = s.displayValue
    else statMap.set(s.name, { displayName: label, home: '', away: s.displayValue })
  }

  return Response.json({
    homeTeam: home.team.displayName,
    homeLogo,
    awayTeam: away.team.displayName,
    awayLogo,
    stats: Array.from(statMap.values()).filter(s => s.displayName),
  })
}
