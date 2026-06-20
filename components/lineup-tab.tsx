'use client'

import { useEffect, useState } from 'react'

interface Player {
  name: string
  jersey: string
  position: string
  positionName: string
  subbedOut: boolean
  subbedOutTime: string
  replacedBy: string
  didScore: boolean
  yellowCards: number
  redCards: number
}

interface TeamLineup {
  teamName: string
  teamLogo: string
  formation: string
  starters: Player[]
}

// ESPN uses granular position codes (CD-L, CM-R, CF-L, SW, etc.)
// positionName is more reliable for grouping
function resolveGroup(pos: string, posName: string): string {
  const n = posName.toLowerCase()
  if (n.includes('goalkeeper') || n === 'g' || pos === 'G' || pos === 'GK') return 'Goalkeeper'
  if (n.includes('defend') || n.includes('back') || n.includes('sweeper') || n.includes('center d')) return 'Defenders'
  if (n.includes('mid')) return 'Midfielders'
  if (n.includes('forward') || n.includes('wing') || n.includes('striker') || n.includes('winger')) return 'Forwards'
  // Abbreviation fallback
  const p = pos.toUpperCase()
  if (p.startsWith('G')) return 'Goalkeeper'
  if (p.startsWith('CD') || p === 'LB' || p === 'RB' || p === 'LWB' || p === 'RWB' || p === 'SW' || p === 'D') return 'Defenders'
  if (p.startsWith('CM') || p === 'LM' || p === 'RM' || p === 'DM' || p === 'AM' || p === 'M') return 'Midfielders'
  if (p.startsWith('CF') || p === 'LF' || p === 'RF' || p === 'LW' || p === 'RW' || p === 'ST' || p === 'F') return 'Forwards'
  return 'Midfielders' // safe default rather than "Other"
}

const GROUP_ORDER = ['Goalkeeper', 'Defenders', 'Midfielders', 'Forwards', 'Other']

function groupPlayers(players: Player[]) {
  const map = new Map<string, Player[]>()
  for (const p of players) {
    const group = resolveGroup(p.position, p.positionName)
    if (!map.has(group)) map.set(group, [])
    map.get(group)!.push(p)
  }
  return GROUP_ORDER.flatMap(g => map.has(g) ? [{ group: g, players: map.get(g)! }] : [])
}

function PlayerRow({ p, align }: { p: Player; align: 'left' | 'right' }) {
  const isRight = align === 'right'
  return (
    <div style={{
      display: 'flex',
      flexDirection: isRight ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid #f5f5f3',
    }}>
      {/* Jersey number */}
      <span style={{
        fontSize: 11, color: '#ccc', fontWeight: 700,
        width: 20, textAlign: isRight ? 'left' : 'right', flexShrink: 0, paddingTop: 1,
      }}>{p.jersey}</span>

      {/* Name + sub info */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          flexDirection: isRight ? 'row-reverse' : 'row',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: p.subbedOut ? '#999' : '#111' }}>
            {p.name}
          </span>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {p.didScore && <span style={{ fontSize: 12 }}>⚽</span>}
            {(p.yellowCards ?? 0) > 0 && <span style={{ width: 8, height: 11, backgroundColor: '#f5c518', borderRadius: 1, display: 'inline-block' }} />}
            {(p.redCards ?? 0) > 0 && <span style={{ width: 8, height: 11, backgroundColor: '#e53e3e', borderRadius: 1, display: 'inline-block' }} />}
          </div>
        </div>

        {/* Sub out → sub in */}
        {p.subbedOut && p.replacedBy && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 3,
            flexDirection: isRight ? 'row-reverse' : 'row',
          }}>
            <span style={{ fontSize: 10, color: '#e53e3e', fontWeight: 600 }}>
              ↓{p.subbedOutTime}
            </span>
            <span style={{ fontSize: 10, color: '#38a169', fontWeight: 600 }}>
              ↑{p.replacedBy}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamColumn({ team, align }: { team: TeamLineup; align: 'left' | 'right' }) {
  const groups = groupPlayers(team.starters)
  const isRight = align === 'right'

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
        flexDirection: isRight ? 'row-reverse' : 'row',
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{team.teamName}</span>
        {team.formation && (
          <span style={{
            fontSize: 11, color: '#aaa', backgroundColor: '#f5f5f3',
            padding: '2px 7px', borderRadius: 4, fontWeight: 600,
          }}>{team.formation}</span>
        )}
      </div>

      {groups.map(({ group, players }) => (
        <div key={group} style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#ccc', marginBottom: 2,
            textAlign: isRight ? 'right' : 'left',
          }}>{group}</p>
          {players.map(p => (
            <PlayerRow key={p.jersey + p.name} p={p} align={align} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function LineupTab({ eventId }: { eventId: string }) {
  const [lineups, setLineups] = useState<TeamLineup[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function load() {
      fetch(`/api/espn/match/${eventId}/lineups`)
        .then(r => r.json())
        .then(d => { setLineups(d); setLoading(false) })
        .catch(() => setLoading(false))
    }
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [eventId])

  if (loading) return <Empty text="Loading lineups…" />
  if (!lineups?.length) return <Empty text="Lineups not available yet" />

  const [home, away] = lineups

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
      <TeamColumn team={home} align="left" />
      {away && <TeamColumn team={away} align="right" />}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={{ textAlign: 'center', padding: '60px 0', color: '#ccc', fontSize: 14 }}>{text}</div>
}
