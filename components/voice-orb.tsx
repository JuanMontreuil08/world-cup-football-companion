'use client'

import { motion } from 'framer-motion'
import { OrbState } from '@/hooks/use-match-session'

// Gold gradient stops per state
const STATE_COLORS: Record<OrbState, { inner: string; outer: string; glow: string; rings: string }> = {
  idle:      { inner: '#F5D060', outer: '#B8860B', glow: 'rgba(212,168,67,0.25)', rings: 'rgba(212,168,67,0)' },
  listening: { inner: '#FFE680', outer: '#D4A843', glow: 'rgba(212,168,67,0.55)', rings: 'rgba(212,168,67,0.7)' },
  thinking:  { inner: '#E8C84A', outer: '#9A7010', glow: 'rgba(180,130,40,0.45)', rings: 'rgba(180,130,40,0.6)' },
  speaking:  { inner: '#FFED90', outer: '#C8920A', glow: 'rgba(220,160,50,0.65)', rings: 'rgba(220,160,50,0.75)' },
  error:     { inner: '#F87171', outer: '#DC2626', glow: 'rgba(220,38,38,0.35)', rings: 'rgba(220,38,38,0)' },
}

// Blob border-radius keyframes per state — 8-value CSS syntax
const BLOB_SHAPES: Record<OrbState, string[]> = {
  idle: [
    '60% 40% 54% 46% / 48% 62% 38% 52%',
    '46% 54% 42% 58% / 56% 44% 60% 40%',
    '60% 40% 54% 46% / 48% 62% 38% 52%',
  ],
  listening: [
    '30% 70% 62% 38% / 52% 36% 64% 48%',
    '68% 32% 38% 62% / 40% 66% 34% 60%',
    '44% 56% 72% 28% / 62% 42% 58% 38%',
    '30% 70% 62% 38% / 52% 36% 64% 48%',
  ],
  thinking: [
    '50% 50% 50% 50% / 50% 50% 50% 50%',
    '55% 45% 48% 52% / 52% 54% 46% 48%',
    '48% 52% 55% 45% / 46% 48% 54% 52%',
    '50% 50% 50% 50% / 50% 50% 50% 50%',
  ],
  speaking: [
    '38% 62% 56% 44% / 44% 38% 62% 56%',
    '72% 28% 40% 60% / 58% 70% 30% 42%',
    '44% 56% 68% 32% / 38% 52% 48% 62%',
    '28% 72% 52% 48% / 66% 34% 56% 44%',
    '38% 62% 56% 44% / 44% 38% 62% 56%',
  ],
  error: [
    '50% 50% 50% 50% / 50% 50% 50% 50%',
  ],
}

const BLOB_DURATION: Record<OrbState, number> = {
  idle:      2.5,
  listening: 0.7,
  thinking:  1.2,
  speaking:  0.5,
  error:     1,
}

const BLOB_SCALE: Record<OrbState, number> = {
  idle:      1,
  listening: 1.06,
  thinking:  0.96,
  speaking:  1.1,
  error:     0.92,
}

const LABELS: Record<OrbState, string> = {
  idle:      'Tap to talk',
  listening: 'Listening...',
  thinking:  'Thinking...',
  speaking:  'Speaking...',
  error:     'Error',
}

const RING_STATES: OrbState[] = ['listening', 'speaking']
const RING_COUNT = 3

export function VoiceOrb({ state, onClick }: { state: OrbState; onClick: () => void }) {
  const colors = STATE_COLORS[state]
  const showRings = RING_STATES.includes(state)


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div
        onClick={onClick}
        style={{ position: 'relative', width: 200, height: 200, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Sonar rings */}
        {showRings && RING_COUNT && Array.from({ length: RING_COUNT }).map((_, i) => (
          <motion.div
            key={`${state}-ring-${i}`}
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{
              duration: state === 'speaking' ? 1.2 : 1.8,
              repeat: Infinity,
              delay: i * (state === 'speaking' ? 0.4 : 0.6),
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              width: 160,
              height: 160,
              borderRadius: '50%',
              border: `1.5px solid ${colors.rings}`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Main blob — outline only, no fill */}
        <motion.div
          animate={{
            borderRadius: BLOB_SHAPES[state],
            scale: BLOB_SCALE[state],
          }}
          transition={{
            duration: BLOB_DURATION[state],
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: 160,
            height: 160,
            background: 'transparent',
            border: `2px solid ${colors.inner}`,
            boxShadow: `0 0 12px ${colors.glow}, 0 0 28px ${colors.glow}, inset 0 0 12px ${colors.glow}`,
          }}
        />
      </div>

      {/* State label */}
      <motion.span
        key={state}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: state === 'idle' ? '#bbb' : colors.outer,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {LABELS[state]}
      </motion.span>
    </div>
  )
}
