import Image from 'next/image'

function TeamLogo({ src, alt, size = 72 }: { src: string; alt: string; size?: number }) {
  if (!src) return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: '#f0eeeb', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, color: '#ccc',
    }}>
      ⚽
    </div>
  )
  return (
    <Image src={src} alt={alt} width={size} height={size}
      style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.12))' }} />
  )
}

interface Props {
  homeTeam: string
  homeLogo: string
  homeScore: string
  awayTeam: string
  awayLogo: string
  awayScore: string
  state: string
  clock: string
}

export function MatchHeader({ homeTeam, homeLogo, homeScore, awayTeam, awayLogo, awayScore, state, clock }: Props) {
  const isLive = state === 'in'
  const isPre = state === 'pre'

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      {/* Home */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <TeamLogo src={homeLogo} alt={homeTeam} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111', textAlign: 'center' }}>{homeTeam}</span>
      </div>

      {/* Score / VS / clock */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 120 }}>
        {isPre ? (
          <span style={{ fontSize: 28, fontWeight: 200, color: '#ccc', letterSpacing: '0.1em' }}>vs</span>
        ) : (
          <span style={{ fontSize: 44, fontWeight: 700, color: '#111', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {homeScore}
            <span style={{ opacity: 0.2, margin: '0 8px' }}>–</span>
            {awayScore}
          </span>
        )}
        {isLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="live-dot" style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: '#ff2020', display: 'block', boxShadow: '0 0 6px #ff2020',
            }} />
            <span className="live-text" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#ff2020' }}>
              LIVE {clock}
            </span>
          </div>
        )}
      </div>

      {/* Away */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <TeamLogo src={awayLogo} alt={awayTeam} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111', textAlign: 'center' }}>{awayTeam}</span>
      </div>
    </div>
  )
}
