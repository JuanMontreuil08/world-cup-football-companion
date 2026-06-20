'use client'

import { useEffect, useState } from 'react'

interface StatRow { displayName: string; home: string; away: string }

interface StatsData {
  homeTeam: string
  awayTeam: string
  stats: StatRow[]
}


function parseVal(v: string): number {
  const n = parseFloat(v.replace('%', '').replace(',', ''))
  return isNaN(n) ? 0 : n
}

function StatRow({ label, home, away, homeColor, awayColor }: {
  label: string; home: string; away: string
  homeColor: string; awayColor: string
}) {
  const hv = parseVal(home)
  const av = parseVal(away)
  const total = hv + av || 1
  const hPct = (hv / total) * 100
  const aPct = (av / total) * 100
  const homeWins = hv > av
  const awayWins = av > hv

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f5f5f3' }}>
      {/* Home value */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
        <span style={{
          fontSize: 18, fontWeight: 700, color: homeWins ? '#111' : '#bbb',
          letterSpacing: '-0.03em', minWidth: 36, textAlign: 'right',
        }}>{home || '0'}</span>
        <div style={{ width: 80, height: 4, borderRadius: 2, backgroundColor: '#f0f0ee', overflow: 'hidden', transform: 'scaleX(-1)' }}>
          <div style={{ width: `${hPct}%`, height: '100%', backgroundColor: homeColor, borderRadius: 2, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Label */}
      <span style={{ fontSize: 11, color: '#aaa', fontWeight: 500, textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
        {label}
      </span>

      {/* Away value */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 80, height: 4, borderRadius: 2, backgroundColor: '#f0f0ee', overflow: 'hidden' }}>
          <div style={{ width: `${aPct}%`, height: '100%', backgroundColor: awayColor, borderRadius: 2, transition: 'width 0.6s ease' }} />
        </div>
        <span style={{
          fontSize: 18, fontWeight: 700, color: awayWins ? '#111' : '#bbb',
          letterSpacing: '-0.03em', minWidth: 36,
        }}>{away || '0'}</span>
      </div>
    </div>
  )
}

export function StatsTab({ eventId, homeColor, awayColor }: { eventId: string; homeColor: string; awayColor: string }) {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function load() {
      fetch(`/api/espn/match/${eventId}/stats`)
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false) })
        .catch(() => setLoading(false))
    }
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [eventId])

  if (loading) return <Empty text="Loading stats…" />
  if (!data?.stats?.length) return <Empty text="Stats not available yet" />

  // Map key ESPN stat names to display labels
  const KEY_MAP: { espnName: string; label: string }[] = [
    { espnName: 'possession', label: 'Possession %' },
    { espnName: 'shots', label: 'Shots' },
    { espnName: 'on goal', label: 'On Target' },
    { espnName: 'corner', label: 'Corners' },
    { espnName: 'fouls', label: 'Fouls' },
    { espnName: 'yellow', label: 'Yellow Cards' },
    { espnName: 'offsides', label: 'Offsides' },
    { espnName: 'saves', label: 'Saves' },
  ]

  const rows = KEY_MAP.flatMap(({ espnName, label }) => {
    // find matching stat (partial name match)
    const match = data.stats.find(s => s.displayName.toLowerCase().includes(espnName))
    if (!match) return []
    return [{ label, home: match.home, away: match.away }]
  })

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Team names */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111', textAlign: 'right' }}>{data.homeTeam}</span>
        <span style={{ fontSize: 11, color: '#ddd', textAlign: 'center' }}>vs</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{data.awayTeam}</span>
      </div>

      {/* Color legend dots */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: homeColor, display: 'inline-block' }} />
        </div>
        <div />
        <div>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: awayColor, display: 'inline-block' }} />
        </div>
      </div>

      {rows.map(r => (
        <StatRow key={r.label} label={r.label} home={r.home} away={r.away} homeColor={homeColor} awayColor={awayColor} />
      ))}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={{ textAlign: 'center', padding: '60px 0', color: '#ccc', fontSize: 14 }}>{text}</div>
}
