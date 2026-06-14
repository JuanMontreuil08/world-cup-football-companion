'use client';

import { OrbState } from '@/hooks/use-match-session';

const styles: Record<OrbState, string> = {
  idle:      'bg-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)]',
  listening: 'bg-blue-500/80 shadow-[0_0_60px_rgba(59,130,246,0.8)] animate-pulse',
  thinking:  'bg-purple-500/80 shadow-[0_0_60px_rgba(168,85,247,0.8)] animate-spin',
  speaking:  'bg-green-500/80 shadow-[0_0_60px_rgba(34,197,94,0.8)] animate-bounce',
  error:     'bg-red-500/80 shadow-[0_0_60px_rgba(239,68,68,0.8)]',
};

const labels: Record<OrbState, string> = {
  idle:      'Tap to talk',
  listening: 'Listening...',
  thinking:  'Thinking...',
  speaking:  'Speaking...',
  error:     'Error',
};

interface Props {
  state: OrbState;
  onClick: () => void;
}

export function VoiceOrb({ state, onClick }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={onClick}
        className={`w-32 h-32 rounded-full transition-all duration-300 ${styles[state]}`}
        aria-label={labels[state]}
      />
      <span className="text-sm text-white/50">{labels[state]}</span>
    </div>
  );
}
