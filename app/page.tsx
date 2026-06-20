import React from 'react'
import { getMatchColors } from '@/lib/teamColors'
import { MatchSchedule } from '@/components/match-schedule'

interface Competitor {
  homeAway: 'home' | 'away'
  score: string
  team: { displayName: string; logo: string }
}

interface ESPNEvent {
  id: string
  date: string
  competitions: [{
    altGameNote: string
    status: { displayClock: string; type: { state: string } }
    competitors: Competitor[]
  }]
}

export interface MatchCard {
  id: string
  date: string
  group: string
  state: string
  clock: string
  homeTeam: string
  homeLogo: string
  homeScore: string
  homeColor: string
  awayTeam: string
  awayLogo: string
  awayScore: string
  awayColor: string
}

function utc5Day(isoDate: string): string {
  return new Date(new Date(isoDate).getTime() - 5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

async function getMatches(): Promise<MatchCard[]> {
  const nowUTC5 = new Date(Date.now() - 5 * 60 * 60 * 1000)
  const start = nowUTC5.toISOString().slice(0, 10).replace(/-/g, '')

  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=100&dates=${start}-20260628`,
    { next: { revalidate: 60 } }
  )
  const data = await res.json()
  const events: ESPNEvent[] = data.events ?? []

  return events
    .filter(e => {
      const comp = e.competitions[0]
      if (comp.status.type.state === 'post') return false
      // Filter out knockout placeholder matches (teams not yet decided)
      const isPlaceholder = comp.competitors.some(c =>
        c.team.displayName.toLowerCase().includes('group') ||
        c.team.displayName.toLowerCase().includes('place') ||
        c.team.displayName.toLowerCase().includes('winner')
      )
      return !isPlaceholder
    })
    .map(e => {
      const comp = e.competitions[0]
      const home = comp.competitors.find(c => c.homeAway === 'home')!
      const away = comp.competitors.find(c => c.homeAway === 'away')!
      const colors = getMatchColors(home.team.displayName, away.team.displayName)
      return {
        id: e.id,
        date: e.date,
        group: comp.altGameNote.replace('FIFA World Cup, ', ''),
        state: comp.status.type.state,
        clock: comp.status.displayClock,
        homeTeam: home.team.displayName,
        homeLogo: home.team.logo,
        homeScore: home.score,
        homeColor: colors.home.primary,
        awayTeam: away.team.displayName,
        awayLogo: away.team.logo,
        awayScore: away.score,
        awayColor: colors.away.primary,
      }
    })
}

export default async function Page() {
  const matches = await getMatches()

  const todayStr = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const tomorrowStr = new Date(Date.now() - 5 * 60 * 60 * 1000 + 86_400_000).toISOString().slice(0, 10)

  const grouped = new Map<string, MatchCard[]>()
  for (const m of matches) {
    const day = utc5Day(m.date)
    if (!grouped.has(day)) grouped.set(day, [])
    grouped.get(day)!.push(m)
  }

  const todayMatches = grouped.get(todayStr) ?? []
  const tomorrowMatches = grouped.get(tomorrowStr) ?? []
  const upcomingDays = [...grouped.entries()]
    .filter(([d]) => d !== todayStr && d !== tomorrowStr)
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <MatchSchedule
      total={matches.length}
      todayMatches={todayMatches}
      todayLabel={todayStr}
      tomorrowMatches={tomorrowMatches}
      tomorrowLabel={tomorrowStr}
      upcomingDays={upcomingDays}
    />
  )
}
