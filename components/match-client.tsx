'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useMatchSession } from '@/hooks/use-match-session'
import { VoiceOrb } from './voice-orb'
import { MatchHeader } from './match-header'
import { CommentaryFeed } from './commentary-feed'
import { LineupTab } from './lineup-tab'
import { StatsTab } from './stats-tab'
import { NewsTab } from './news-tab'
import { EspnCommentaryEntry, isGoalEvent, isKeyEvent } from '@/lib/espn-api'

type Tab = 'analyst' | 'lineups' | 'stats' | 'news'

const TABS: { id: Tab; label: string }[] = [
  { id: 'analyst', label: 'AI Analyst' },
  { id: 'lineups', label: 'Line-ups' },
  { id: 'stats', label: 'Stats' },
  { id: 'news', label: 'News' },
]

interface MatchClientProps {
  eventId: string
  state: string
  clock: string
  homeTeam: string
  homeLogo: string
  homeScore: string
  homeColor: string
  homeColorSecondary: string
  awayTeam: string
  awayLogo: string
  awayScore: string
  awayColor: string
  awayColorSecondary: string
}

export function MatchClient({
  eventId, state, clock,
  homeTeam, homeLogo, homeScore, homeColor, homeColorSecondary,
  awayTeam, awayLogo, awayScore, awayColor, awayColorSecondary,
// homeColorSecondary and awayColorSecondary are passed through for future use (stats bars, etc.)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
}: MatchClientProps) {
  const { state: session, connect, disconnect, toggleMute, injectContext } = useMatchSession()
  const { status, isMuted, orbState, error } = session
  const isConnected = status === 'connected'
  const lastSeqRef = useRef(0)

  const [activeTab, setActiveTab] = useState<Tab>('analyst')
  const [liveState, setLiveState] = useState({ state, clock, homeScore, awayScore })
  const [commentary, setCommentary] = useState<EspnCommentaryEntry[]>([])

  // Poll live score/clock every 30s
  useEffect(() => {
    async function pollScore() {
      try {
        const res = await fetch('/api/live-scores')
        if (!res.ok) return
        const live: { id: string; state: string; clock: string; homeScore: string; awayScore: string }[] = await res.json()
        const match = live.find(m => m.id === eventId)
        if (match) setLiveState({ state: match.state, clock: match.clock, homeScore: match.homeScore, awayScore: match.awayScore })
      } catch {}
    }
    pollScore()
    const id = setInterval(pollScore, 30_000)
    return () => clearInterval(id)
  }, [eventId])

  // Poll commentary every 30s
  useEffect(() => {
    async function fetchCommentary() {
      try {
        const res = await fetch(`/api/commentary?eventId=${eventId}`)
        if (!res.ok) return
        const entries: EspnCommentaryEntry[] = await res.json()
        if (!Array.isArray(entries) || entries.length === 0) return

        setCommentary(entries)

        if (status !== 'connected') return

        if (lastSeqRef.current === 0) {
          lastSeqRef.current = entries[entries.length - 1].sequence
          return
        }

        const newEntries = entries.filter(e => e.sequence > lastSeqRef.current)
        if (newEntries.length === 0) return

        lastSeqRef.current = newEntries[newEntries.length - 1].sequence

        const regular = newEntries.filter(e => !isKeyEvent(e))
        const key = newEntries.filter(e => isKeyEvent(e))

        if (regular.length > 0) {
          injectContext(`LIVE COMMENTARY:\n${regular.map(e => `${e.time?.displayValue ?? '?'}: ${e.text}`).join('\n')}`)
        }
        for (const entry of key) {
          const prefix = isGoalEvent(entry) ? 'SYSTEM: GOAL — ' : 'SYSTEM: '
          injectContext(`${prefix}${entry.text}`)
        }
      } catch {}
    }

    fetchCommentary()
    const interval = setInterval(fetchCommentary, 30_000)
    return () => clearInterval(interval)
  }, [eventId, status, injectContext])

  const gradient = [
    `radial-gradient(ellipse at 20% 60%, ${homeColor}30 0%, transparent 55%)`,
    `radial-gradient(ellipse at 80% 40%, ${awayColor}30 0%, transparent 55%)`,
  ].join(', ')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f7f4', overflowX: 'hidden' }}>

      {/* Hero gradient header */}
      <div
        className="match-card-gradient"
        style={{
          background: gradient,
          backgroundColor: '#f0eeeb',
          backgroundSize: '200% 200%, 200% 200%',
          padding: '52px 40px 48px',
          position: 'relative',
        }}
      >
        {/* Back */}
        <Link href="/" style={{
          position: 'absolute', top: 24, left: 28,
          fontSize: 12, fontWeight: 600, color: '#aaa', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.04em',
        }}>
          ← Schedule
        </Link>

        <MatchHeader
          homeTeam={homeTeam}
          homeLogo={homeLogo}
          homeScore={liveState.homeScore}
          awayTeam={awayTeam}
          awayLogo={awayLogo}
          awayScore={liveState.awayScore}
          state={liveState.state}
          clock={liveState.clock}
        />
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid #eee',
        padding: '0 40px', backgroundColor: '#fff',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '14px 20px', border: 'none', background: 'none',
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? '#111' : '#aaa',
              cursor: 'pointer',
              borderBottom: activeTab === t.id ? '2px solid #111' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
              letterSpacing: '0.01em',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* AI Analyst tab */}
        {activeTab === 'analyst' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div style={{
              backgroundColor: '#fff', borderRadius: 24, padding: '40px 32px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ccc' }}>
                AI Match Analyst
              </p>
              <VoiceOrb state={orbState} onClick={() => {
                if (status === 'disconnected' || status === 'error') connect()
                else if (isConnected) toggleMute()
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', maxWidth: 260 }}>
                {error && <p style={{ fontSize: 11, color: '#e53e3e', textAlign: 'center' }}>{error}</p>}
                {status === 'disconnected' || status === 'error' ? (
                  <button onClick={connect} style={{
                    width: '100%', padding: '12px 0', borderRadius: 50,
                    backgroundColor: '#111', color: '#fff', border: 'none',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Talk to this match
                  </button>
                ) : (
                  <>
                    {isConnected && (
                      <button onClick={toggleMute} style={{
                        width: '100%', padding: '11px 0', borderRadius: 50,
                        border: '1.5px solid #e8e8e8', backgroundColor: 'transparent',
                        fontSize: 13, color: '#555', cursor: 'pointer',
                      }}>
                        {isMuted ? 'Unmute' : 'Mute'}
                      </button>
                    )}
                    <button onClick={disconnect} style={{
                      width: '100%', padding: '11px 0', borderRadius: 50,
                      border: '1.5px solid #e8e8e8', backgroundColor: 'transparent',
                      fontSize: 13, color: '#999', cursor: 'pointer',
                    }}>
                      {status === 'connecting' ? 'Connecting…' : 'Disconnect'}
                    </button>
                  </>
                )}
                <p style={{ fontSize: 10, color: '#ddd', marginTop: 4 }}>
                  {homeTeam} vs {awayTeam} · {eventId}
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff', borderRadius: 24, padding: '32px',
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)', minHeight: 480,
              display: 'flex', flexDirection: 'column',
            }}>
              <CommentaryFeed entries={commentary} />
            </div>
          </div>
        )}

        {/* Lineups tab */}
        {activeTab === 'lineups' && (
          <div style={{
            backgroundColor: '#fff', borderRadius: 24, padding: '32px',
            boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
          }}>
            <LineupTab eventId={eventId} />
          </div>
        )}

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <div style={{
            backgroundColor: '#fff', borderRadius: 24, padding: '32px',
            boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
          }}>
            <StatsTab eventId={eventId} homeColor={homeColor} awayColor={awayColor} />
          </div>
        )}

        {/* News tab */}
        {activeTab === 'news' && (
          <div style={{
            backgroundColor: '#fff', borderRadius: 24, padding: '32px',
            boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
          }}>
            <NewsTab eventId={eventId} homeTeam={homeTeam} awayTeam={awayTeam} />
          </div>
        )}

      </div>
    </div>
  )
}
