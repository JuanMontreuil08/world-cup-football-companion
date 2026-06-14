'use client';

import { useEffect, useRef, useState } from 'react';
import { useMatchSession } from '@/hooks/use-match-session';
import { VoiceOrb } from './voice-orb';
import { MatchHeader } from './match-header';
import { LiveMatch, Lineup } from '@/types/football';

const MATCH_ID = '1489374';

function buildRosterText(lineups: Lineup[]): string {
  return lineups
    .map((lineup) => {
      const players = [
        ...lineup.startXI.map((e) => e.player),
        ...lineup.substitutes.map((e) => e.player),
      ];
      const list = players.map((p) => `${p.name} (id:${p.id}, #${p.number}, ${p.pos})`).join(', ');
      return `${lineup.team.name}: ${list}`;
    })
    .join('\n');
}

export function MatchClient() {
  const { state, connect, disconnect, toggleMute, injectContext } = useMatchSession();
  const { status, isMuted, orbState, error } = state;
  const isConnected = status === 'connected';
  const rosterInjected = useRef(false);

  const [minute, setMinute] = useState<number>(0);
  const [homeGoals, setHomeGoals] = useState<number | null>(null);
  const [awayGoals, setAwayGoals] = useState<number | null>(null);

  // Inject player roster once after session connects
  useEffect(() => {
    if (status !== 'connected' || rosterInjected.current) return;
    rosterInjected.current = true;

    console.log('[match-client] Fetching lineups...');
    fetch(`/api/match/${MATCH_ID}/lineups`)
      .then((r) => r.json())
      .then((lineups: Lineup[]) => {
        console.log('[match-client] Lineups response:', lineups);
        if (!lineups?.length) {
          console.warn('[match-client] Lineups empty — skipping roster injection');
          return;
        }
        const text = `CONTEXT: Full player roster with IDs for this match:\n${buildRosterText(lineups)}\nUse these IDs when calling getPlayerStats.`;
        console.log('[match-client] Injecting player roster:\n', text);
        injectContext(text);
      })
      .catch((err) => {
        console.error('[match-client] Lineup fetch failed:', err);
      });
  }, [status, injectContext]);

  // Reset roster flag on disconnect so reconnect re-injects
  useEffect(() => {
    if (status === 'disconnected') rosterInjected.current = false;
  }, [status]);

  // Poll live match status every 30s to keep minute updated
  useEffect(() => {
    async function fetchMinute() {
      try {
        const res = await fetch('/api/matches/live');
        if (!res.ok) return;
        const matches: LiveMatch[] = await res.json();
        const match = matches.find((m) => String(m.fixture.id) === MATCH_ID);
        if (match?.fixture.status.elapsed != null) {
          setMinute(match.fixture.status.elapsed);
        }
        if (match) {
          setHomeGoals(match.goals.home);
          setAwayGoals(match.goals.away);
        }
      } catch {}
    }

    fetchMinute();
    const interval = setInterval(fetchMinute, 30_000);
    return () => clearInterval(interval);
  }, []);

  function handleOrbClick() {
    if (status === 'disconnected' || status === 'error') {
      connect();
    } else if (isConnected) {
      toggleMute();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-between py-12 px-4">
      <MatchHeader minute={minute} homeGoals={homeGoals} awayGoals={awayGoals} />

      <VoiceOrb state={orbState} onClick={handleOrbClick} />

      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}

        {isConnected && (
          <button
            onClick={toggleMute}
            className="w-full py-2 rounded-full border border-white/20 text-white/60 text-sm hover:bg-white/5 transition"
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        )}

        <button
          onClick={isConnected ? disconnect : connect}
          className="w-full py-2 rounded-full border border-white/20 text-white/60 text-sm hover:bg-white/5 transition"
        >
          {status === 'connecting' ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
        </button>

        <p className="text-white/20 text-xs">Match ID: {MATCH_ID} · status: {status}</p>
      </div>
    </div>
  );
}
