'use client'

import { EspnCommentaryEntry, isGoalEvent } from '@/lib/espn-api'

function isHalfEndOrStart(text: string): boolean {
  const t = text.toLowerCase()
  return (
    t.includes('first half ends') ||
    t.includes('second half begins') ||
    t.includes('second half ends') ||
    t.includes('extra time') ||
    t.includes('full time') ||
    t.includes('half time')
  )
}

function groupByHalf(entries: EspnCommentaryEntry[]): { label: string; entries: EspnCommentaryEntry[] }[] {
  // entries are in ascending order (minute 1 first)
  const groups: { label: string; entries: EspnCommentaryEntry[] }[] = []
  let current: EspnCommentaryEntry[] = []
  let halfNum = 1

  for (const entry of entries) {
    current.push(entry)
    const t = entry.text.toLowerCase()
    if (t.includes('first half ends') || t.includes('half time')) {
      groups.push({ label: '1st Half', entries: current })
      current = []
      halfNum = 2
    } else if (t.includes('second half ends') || t.includes('full time')) {
      groups.push({ label: '2nd Half', entries: current })
      current = []
      halfNum = 3
    } else if (t.includes('extra time')) {
      groups.push({ label: `${halfNum === 3 ? 'Extra Time 1st' : 'Extra Time 2nd'} Half`, entries: current })
      current = []
      halfNum++
    }
  }

  // Remaining entries (live half in progress)
  if (current.length > 0) {
    const labels: Record<number, string> = { 1: '1st Half', 2: '2nd Half', 3: 'Extra Time', 4: 'Penalties' }
    groups.push({ label: labels[halfNum] ?? `Half ${halfNum}`, entries: current })
  }

  // Reverse so most recent half is on top
  return groups.reverse()
}

export function CommentaryFeed({ entries }: { entries: EspnCommentaryEntry[] }) {
  const groups = groupByHalf(entries)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#ccc', marginBottom: 20, flexShrink: 0,
      }}>
        Live Commentary
      </p>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {entries.length === 0 ? (
          <p style={{ fontSize: 13, color: '#ccc', padding: '16px 0' }}>No commentary yet</p>
        ) : (
          groups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: gi < groups.length - 1 ? 28 : 0 }}>
              {/* Half label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#bbb',
                  backgroundColor: '#f5f5f3', padding: '3px 8px', borderRadius: 4,
                }}>
                  {group.label}
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#f0f0f0' }} />
              </div>

              {/* Entries in reverse (most recent first within each half) */}
              {[...group.entries].reverse().map(entry => {
                const goal = isGoalEvent(entry)
                const isMilestone = isHalfEndOrStart(entry.text)
                return (
                  <div key={entry.sequence} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    padding: '9px 0',
                    borderBottom: '1px solid #f3f3f3',
                    ...(goal ? {
                      backgroundColor: '#fffbeb',
                      borderRadius: 8,
                      paddingLeft: 8, paddingRight: 8,
                      marginLeft: -8, marginRight: -8,
                    } : {}),
                  }}>
                    <span style={{
                      flexShrink: 0, fontSize: 10, fontFamily: 'monospace',
                      width: 36, textAlign: 'right', paddingTop: 2,
                      color: isMilestone ? '#bbb' : '#d0d0d0',
                    }}>
                      {entry.time?.displayValue ?? '—'}
                    </span>
                    <p style={{
                      fontSize: 12.5, lineHeight: 1.5, margin: 0,
                      color: goal ? '#b7791f' : isMilestone ? '#aaa' : '#555',
                      fontWeight: goal ? 600 : isMilestone ? 500 : 400,
                      fontStyle: isMilestone ? 'italic' : 'normal',
                    }}>
                      {entry.text}
                    </p>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
