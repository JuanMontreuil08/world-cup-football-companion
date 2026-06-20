const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const res = await fetch(`${ESPN_BASE}/summary?event=${eventId}`, { next: { revalidate: 60 } })
  if (!res.ok) return Response.json({ error: 'ESPN error' }, { status: res.status })

  const data = await res.json()
  const rosters: unknown[] = data.rosters ?? []

  if (!rosters.length) return Response.json([])

  // Normalize the roster structure into something predictable
  const teams = rosters.map((r: unknown) => {
    const roster = r as {
      team: { displayName: string; logo?: string; logos?: { href: string }[] }
      formation?: string
      roster: {
        athlete: { displayName: string }
        jersey?: string                                   // top-level on roster entry
        position?: { abbreviation: string; name: string } // top-level on roster entry
        starter: boolean
        subbedIn?: boolean
        subbedOut?: boolean
        clock?: { displayValue: string }
        didScore?: boolean
        yellowCards?: number
        redCards?: number
        subbedOutFor?: { jersey?: string; athlete?: { displayName: string } }
      }[]
    }
    const logo = roster.team.logos?.[0]?.href ?? roster.team.logo ?? ''
    return {
      teamName: roster.team.displayName,
      teamLogo: logo,
      formation: roster.formation ?? '',
      starters: roster.roster
        .filter(p => p.starter)
        .map(p => ({
          name: p.athlete.displayName,
          jersey: p.jersey ?? '',
          position: p.position?.abbreviation ?? '',
          positionName: p.position?.name ?? '',
          subbedOut: p.subbedOut ?? false,
          subbedOutTime: p.subbedOut ? (p.clock?.displayValue ?? '') : '',
          replacedBy: p.subbedOutFor?.athlete?.displayName ?? '',
          didScore: p.didScore ?? false,
          yellowCards: p.yellowCards ?? 0,
          redCards: p.redCards ?? 0,
        })),
    }
  })

  return Response.json(teams)
}
