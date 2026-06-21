const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const res = await fetch(`${ESPN_BASE}/summary?event=${eventId}`, { next: { revalidate: 300 } })
  if (!res.ok) return Response.json({ error: 'ESPN error' }, { status: res.status })

  const data = await res.json()
  const articles: {
    id: number
    headline?: string
    description?: string
    published?: string
    byline?: string
    images?: { url: string; width?: number }[]
    links?: { web?: { href?: string } }
  }[] = data.news?.articles ?? []

  const { searchParams } = new URL(req.url)
  const homeTeam = searchParams.get('home') ?? ''
  const awayTeam = searchParams.get('away') ?? ''

  // Filter to articles that mention either team
  const teamWords = [...homeTeam.split(' '), ...awayTeam.split(' ')]
    .map(w => w.toLowerCase())
    .filter(w => w.length > 2)

  const relevant = articles.filter(a => {
    const text = `${a.headline ?? ''} ${a.description ?? ''}`.toLowerCase()
    return teamWords.some(w => text.includes(w))
  })

  const normalized = relevant.map(a => ({
    id: a.id,
    headline: a.headline ?? '',
    description: a.description ?? '',
    published: a.published ?? '',
    byline: a.byline ?? '',
    image: a.images?.find(i => i.width && i.width >= 800)?.url ?? a.images?.[0]?.url ?? '',
    url: a.links?.web?.href ?? '',
  }))

  return Response.json(normalized)
}
