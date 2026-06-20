'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Article {
  id: number
  headline: string
  description: string
  published: string
  byline: string
  image: string
  url: string
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function NewsTab({ eventId, homeTeam, awayTeam }: { eventId: string; homeTeam: string; awayTeam: string }) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/espn/match/${eventId}/news?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}`)
      .then(r => r.json())
      .then(d => { setArticles(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [eventId])

  if (loading) return <Empty text="Loading news…" />
  if (!articles.length) return <Empty text="No news available for this match" />

  return (
    <div>
      <p style={{ fontSize: 11, color: '#ccc', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
        {homeTeam} · {awayTeam} — ESPN news
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {articles.map(a => (
          <a
            key={a.id}
            href={a.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none', display: 'flex', gap: 16,
              backgroundColor: '#fafaf9', borderRadius: 14,
              border: '1px solid #f0f0ee', overflow: 'hidden',
              cursor: a.url ? 'pointer' : 'default',
              transition: 'box-shadow 0.15s',
            }}
          >
            {/* Thumbnail */}
            {a.image && (
              <div style={{ flexShrink: 0, width: 130, height: 88, position: 'relative', overflow: 'hidden' }}>
                <Image
                  src={a.image} alt={a.headline}
                  fill style={{ objectFit: 'cover' }}
                  sizes="130px"
                />
              </div>
            )}

            {/* Text */}
            <div style={{ flex: 1, padding: '14px 16px 14px 0', minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: '#111', lineHeight: 1.4, marginBottom: 5 }}>
                {a.headline}
              </p>
              <p style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                {a.description}
              </p>
              <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#bbb', alignItems: 'center' }}>
                {a.byline && <span>{a.byline}</span>}
                {a.byline && a.published && <span>·</span>}
                {a.published && <span>{timeAgo(a.published)}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={{ textAlign: 'center', padding: '60px 0', color: '#ccc', fontSize: 14 }}>{text}</div>
}
