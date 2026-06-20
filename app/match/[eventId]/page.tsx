import { notFound } from 'next/navigation'
import { getMatchColors } from '@/lib/teamColors'
import { MatchClient } from '@/components/match-client'

interface EspnCompetitor {
  homeAway: 'home' | 'away'
  score: string
  team: {
    displayName: string
    logo?: string                          // scoreboard style
    logos?: { href: string }[]             // summary style
  }
}

interface EspnSummary {
  header: {
    competitions: [{
      status: { displayClock: string; type: { state: string } }
      competitors: EspnCompetitor[]
    }]
  }
}

async function getMatchData(eventId: string) {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`,
    { next: { revalidate: 30 } }
  )
  if (!res.ok) return null

  const data: EspnSummary = await res.json()
  const comp = data.header?.competitions?.[0]
  if (!comp) return null

  const home = comp.competitors.find(c => c.homeAway === 'home')
  const away = comp.competitors.find(c => c.homeAway === 'away')
  if (!home || !away) return null

  const colors = getMatchColors(home.team.displayName, away.team.displayName)

  const getLogo = (c: EspnCompetitor) =>
    c.team.logos?.[0]?.href ?? c.team.logo ?? ''

  return {
    eventId,
    state: comp.status.type.state,
    clock: comp.status.displayClock,
    homeTeam: home.team.displayName,
    homeLogo: getLogo(home),
    homeScore: home.score,
    homeColor: colors.home.primary,
    homeColorSecondary: colors.home.secondary,
    awayTeam: away.team.displayName,
    awayLogo: getLogo(away),
    awayScore: away.score,
    awayColor: colors.away.primary,
    awayColorSecondary: colors.away.secondary,
  }
}

export default async function MatchPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const match = await getMatchData(eventId)
  if (!match) notFound()

  return <MatchClient {...match} />
}
