'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { MatchCard } from '@/app/page'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function formatTime(isoDate: string): string {
  return new Date(new Date(isoDate).getTime() - 5 * 60 * 60 * 1000)
    .toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
    }) + ' CDT'
}

// ─── large match card (carousel item) ────────────────────────────────────────

function CardLarge({ m }: { m: MatchCard }) {
  const isLive = m.state === 'in'
  const gradient = [
    `radial-gradient(ellipse at 18% 55%, ${m.homeColor}48 0%, transparent 55%)`,
    `radial-gradient(ellipse at 82% 45%, ${m.awayColor}48 0%, transparent 55%)`,
  ].join(', ')

  return (
    <Link href={`/match/${m.id}`} style={{ textDecoration: 'none', display: 'block', flexShrink: 0 }}>
      <div
        className="match-card-gradient"
        style={{
          width: 'min(660px, calc(100vw - 112px))',
          height: '260px',
          borderRadius: '22px',
          background: gradient,
          backgroundColor: '#eeecea',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '28px 36px',
          cursor: 'pointer',
          boxShadow: isLive
            ? `0 0 0 1.5px ${m.homeColor}33, 0 8px 40px ${m.homeColor}18`
            : '0 2px 20px rgba(0,0,0,0.08)',
          scrollSnapAlign: 'center',
          transition: 'transform 0.18s ease',
        }}
      >
        {/* LIVE badge */}
        {isLive && (
          <div style={{ position: 'absolute', top: 18, left: 22, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="live-dot" style={{
              width: 7, height: 7, borderRadius: '50%',
              backgroundColor: '#ff2020', display: 'block', boxShadow: '0 0 8px #ff2020',
            }} />
            <span className="live-text" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#ff2020' }}>
              LIVE
            </span>
            <span style={{ fontSize: 11, color: '#ff202088', fontWeight: 500 }}>{m.clock}</span>
          </div>
        )}

        {/* Group */}
        <div style={{
          position: 'absolute', top: 18, right: 22,
          fontSize: 10, fontWeight: 600, letterSpacing: '0.09em',
          color: '#00000040', textTransform: 'uppercase',
        }}>
          {m.group}
        </div>

        {/* Home team */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1 }}>
          <Image src={m.homeLogo} alt={m.homeTeam} width={76} height={76}
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.14))' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.2 }}>
            {m.homeTeam}
          </span>
        </div>

        {/* Center: score / vs / time */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 16px' }}>
          {isLive ? (
            <div style={{ fontSize: 38, fontWeight: 700, color: '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {m.homeScore}
              <span style={{ opacity: 0.25, margin: '0 6px' }}>–</span>
              {m.awayScore}
            </div>
          ) : (
            <div style={{ fontSize: 22, fontWeight: 200, color: '#00000030', letterSpacing: '0.05em' }}>vs</div>
          )}
          <div style={{ fontSize: 11, color: '#00000050', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {formatTime(m.date)}
          </div>
        </div>

        {/* Away team */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1 }}>
          <Image src={m.awayLogo} alt={m.awayTeam} width={76} height={76}
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.14))' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', textAlign: 'center', lineHeight: 1.2 }}>
            {m.awayTeam}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── carousel ────────────────────────────────────────────────────────────────

function Carousel({ matches }: { matches: MatchCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const onScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const center = track.scrollLeft + track.clientWidth / 2
    let closest = 0, minDist = Infinity
    ;(Array.from(track.children) as HTMLElement[]).forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    setActive(closest)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [onScroll])

  const scrollToIdx = (idx: number) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[idx] as HTMLElement
    if (!card) return
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Track */}
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'scroll',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          padding: '8px 56px',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        {matches.map(m => <CardLarge key={m.id} m={m} />)}
      </div>

      {/* Controls row: dots left, arrows right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 56px 0' }}>
        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {matches.map((_, i) => (
            <button key={i} onClick={() => scrollToIdx(i)} style={{
              width: i === active ? 22 : 6, height: 6, borderRadius: 3, border: 'none',
              backgroundColor: i === active ? '#111' : '#d0d0d0',
              cursor: 'pointer', padding: 0, transition: 'all 0.25s ease',
            }} />
          ))}
        </div>

        {/* Arrow buttons */}
        {matches.length > 1 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <NavBtn dir="left" disabled={active === 0} onClick={() => scrollToIdx(Math.max(0, active - 1))} />
            <NavBtn dir="right" disabled={active === matches.length - 1} onClick={() => scrollToIdx(Math.min(matches.length - 1, active + 1))} />
          </div>
        )}
      </div>
    </div>
  )
}

function NavBtn({ dir, disabled, onClick }: { dir: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 44, height: 44, borderRadius: '50%',
      border: `1.5px solid ${disabled ? '#e8e8e8' : '#d0d0d0'}`,
      backgroundColor: disabled ? 'transparent' : '#fff',
      color: disabled ? '#ccc' : '#111',
      cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, transition: 'all 0.15s',
      boxShadow: disabled ? 'none' : '0 2px 10px rgba(0,0,0,0.08)',
    }}>
      {dir === 'left' ? '←' : '→'}
    </button>
  )
}

// ─── section (overlapping card effect) ───────────────────────────────────────

function Section({
  dayLabel, sectionTitle, matches, zIndex, overlap,
}: {
  dayLabel: string
  sectionTitle: string
  matches: MatchCard[]
  zIndex: number
  overlap: boolean   // whether this section slides over the previous
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Slide-up entrance animation via IntersectionObserver
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      }
    }, { threshold: 0.05 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        zIndex,
        backgroundColor: '#f9f7f4',
        borderRadius: overlap ? '28px 28px 0 0' : 0,
        marginTop: overlap ? -44 : 0,
        boxShadow: overlap ? '0 -12px 56px rgba(0,0,0,0.09)' : 'none',
        paddingTop: overlap ? 52 : 24,
        paddingBottom: 64,
        // entrance animation starting state (only for overlapping sections)
        opacity: overlap ? 0 : 1,
        transform: overlap ? 'translateY(20px)' : 'none',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {/* Section header */}
      <div style={{ padding: '0 56px', marginBottom: 28 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#b0b0b0', marginBottom: 6,
        }}>
          {dayLabel}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 style={{
            fontSize: 32, fontWeight: 700, color: '#111',
            letterSpacing: '-0.025em', margin: 0,
            fontFamily: 'var(--font-geist-sans)',
          }}>
            {sectionTitle}
          </h2>
          <span style={{ fontSize: 13, color: '#bbb', fontWeight: 400 }}>
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </span>
        </div>
      </div>

      {/* Carousel */}
      <Carousel matches={matches} />
    </div>
  )
}

// ─── upcoming compact section ─────────────────────────────────────────────────

function UpcomingSection({ days, zIndex }: { days: [string, MatchCard[]][]; zIndex: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      }
    }, { threshold: 0.03 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (days.length === 0) return null

  return (
    <div
      ref={ref}
      style={{
        position: 'relative', zIndex,
        backgroundColor: '#f9f7f4',
        borderRadius: '28px 28px 0 0',
        marginTop: -44,
        boxShadow: '0 -12px 56px rgba(0,0,0,0.09)',
        padding: '52px 56px 100px',
        opacity: 0,
        transform: 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: '#b0b0b0', marginBottom: 36,
      }}>
        Upcoming Matches
      </p>

      {days.map(([day, matches]) => (
        <div key={day} style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#999', marginBottom: 14, letterSpacing: '0.01em' }}>
            {formatDayLabel(day)}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}>
            {matches.map(m => <CardCompact key={m.id} m={m} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function CardCompact({ m }: { m: MatchCard }) {
  const gradient = [
    `radial-gradient(ellipse at 15% 55%, ${m.homeColor}3a 0%, transparent 50%)`,
    `radial-gradient(ellipse at 85% 45%, ${m.awayColor}3a 0%, transparent 50%)`,
  ].join(', ')

  return (
    <Link href={`/match/${m.id}`} style={{ textDecoration: 'none' }}>
      <div className="match-card-gradient" style={{
        borderRadius: 14, background: gradient, backgroundColor: '#edecea',
        padding: '13px 16px', display: 'flex', alignItems: 'center',
        gap: 12, cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        transition: 'transform 0.15s',
      }}>
        <Image src={m.homeLogo} alt={m.homeTeam} width={26} height={26} style={{ objectFit: 'contain' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9, color: '#00000040', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3,
          }}>
            {m.group}
          </div>
          <div style={{
            fontSize: 11, color: '#2a2a2a', fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {m.homeTeam} <span style={{ color: '#bbb', fontWeight: 300 }}>vs</span> {m.awayTeam}
          </div>
          <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>
            {formatTime(m.date)}
          </div>
        </div>
        <Image src={m.awayLogo} alt={m.awayTeam} width={26} height={26} style={{ objectFit: 'contain' }} />
      </div>
    </Link>
  )
}

// ─── completed matches section ────────────────────────────────────────────────

function formatDatePlayed(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

function CompletedSection({ matches }: { matches: MatchCard[] }) {
  const [open, setOpen] = useState(false)

  if (matches.length === 0) return null

  return (
    <div style={{
      position: 'relative', zIndex: 40,
      backgroundColor: '#f9f7f4',
      borderRadius: '28px 28px 0 0',
      marginTop: -44,
      boxShadow: '0 -12px 56px rgba(0,0,0,0.09)',
      padding: '52px 56px 80px',
    }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          marginBottom: open ? 32 : 0,
        }}
      >
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#b0b0b0', margin: 0,
        }}>
          Completed Matches
        </p>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#ccc',
          backgroundColor: '#ebebeb', borderRadius: 20,
          padding: '2px 8px',
        }}>
          {matches.length}
        </span>
        <span style={{
          fontSize: 13, color: '#ccc',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease',
          display: 'inline-block',
          marginLeft: 2,
        }}>
          ▾
        </span>
      </button>

      {/* Match grid */}
      {open && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 10,
        }}>
          {[...matches].reverse().map(m => (
            <Link key={m.id} href={`/match/${m.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                borderRadius: 14,
                background: [
                  `radial-gradient(ellipse at 15% 55%, ${m.homeColor}28 0%, transparent 50%)`,
                  `radial-gradient(ellipse at 85% 45%, ${m.awayColor}28 0%, transparent 50%)`,
                ].join(', '),
                backgroundColor: '#edecea',
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                transition: 'transform 0.15s',
              }}>
                {/* Home */}
                <Image src={m.homeLogo} alt={m.homeTeam} width={28} height={28} style={{ objectFit: 'contain' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 9, color: '#00000040', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3,
                  }}>
                    {m.group} · {formatDatePlayed(m.date)}
                  </div>
                  <div style={{
                    fontSize: 12, color: '#2a2a2a', fontWeight: 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {m.homeTeam}
                    <span style={{ color: '#999', fontWeight: 400, margin: '0 6px' }}>
                      {m.homeScore}–{m.awayScore}
                    </span>
                    {m.awayTeam}
                  </div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Final</span>
                    <span style={{ color: '#ddd' }}>·</span>
                    <span>Ask AI ↗</span>
                  </div>
                </div>
                {/* Away */}
                <Image src={m.awayLogo} alt={m.awayTeam} width={28} height={28} style={{ objectFit: 'contain' }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── live score patch ─────────────────────────────────────────────────────────

interface LivePatch { id: string; state: string; clock: string; homeScore: string; awayScore: string }

function useLiveScores(initialMatches: MatchCard[]): MatchCard[] {
  const [patches, setPatches] = useState<Map<string, LivePatch>>(new Map())

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/live-scores')
        if (!res.ok) return
        const live: LivePatch[] = await res.json()
        if (!live.length) return
        setPatches(new Map(live.map(p => [p.id, p])))
      } catch {}
    }
    poll()
    const id = setInterval(poll, 30_000)
    return () => clearInterval(id)
  }, [])

  if (patches.size === 0) return initialMatches
  return initialMatches.map(m => {
    const p = patches.get(m.id)
    if (!p) return m
    return { ...m, state: p.state, clock: p.clock, homeScore: p.homeScore, awayScore: p.awayScore }
  })
}

// ─── root ─────────────────────────────────────────────────────────────────────

export function MatchSchedule({
  total, todayMatches, todayLabel, tomorrowMatches, tomorrowLabel, upcomingDays, completedMatches = [],
}: {
  total: number
  todayMatches: MatchCard[]
  todayLabel: string
  tomorrowMatches: MatchCard[]
  tomorrowLabel: string
  upcomingDays: [string, MatchCard[]][]
  completedMatches: MatchCard[]
}) {
  const allToday = useLiveScores(todayMatches)
  const allTomorrow = useLiveScores(tomorrowMatches)

  return (
    <div style={{ backgroundColor: '#f9f7f4', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Hero — sits above the first section */}
      <div style={{ padding: '72px 56px 56px', textAlign: 'center' }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: '#ccc', marginBottom: 12,
        }}>
          FIFA World Cup 2026 · Group Stage
        </p>
        <h1 style={{
          fontSize: 56, fontWeight: 700, color: '#111',
          letterSpacing: '-0.035em', margin: '0 0 4px',
          fontFamily: 'var(--font-geist-sans)', lineHeight: 1,
        }}>
          {total}
          <span style={{ color: '#ccc', fontWeight: 300, marginLeft: 12 }}>matches</span>
        </h1>
        <p style={{ fontSize: 13, color: '#ccc', marginTop: 6 }}>remaining · all times in CDT (UTC−5)</p>
      </div>

      {/* Today — first section, no overlap */}
      {allToday.length > 0 && (
        <Section
          dayLabel={formatDayLabel(todayLabel)}
          sectionTitle="Today"
          matches={allToday}
          zIndex={10}
          overlap={false}
        />
      )}

      {/* Tomorrow — slides up over Today */}
      {allTomorrow.length > 0 && (
        <Section
          dayLabel={formatDayLabel(tomorrowLabel)}
          sectionTitle="Tomorrow"
          matches={allTomorrow}
          zIndex={20}
          overlap={todayMatches.length > 0}
        />
      )}

      {/* Upcoming — slides up over Tomorrow */}
      {upcomingDays.length > 0 && (
        <UpcomingSection days={upcomingDays} zIndex={30} />
      )}

      {/* Completed — collapsed dropdown at the bottom */}
      <CompletedSection matches={completedMatches} />

    </div>
  )
}
