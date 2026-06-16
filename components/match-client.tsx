'use client';

import { useEffect, useRef, useState } from 'react';
import { useMatchSession } from '@/hooks/use-match-session';
import { VoiceOrb } from './voice-orb';
import { MatchHeader } from './match-header';
import { CommentaryFeed } from './commentary-feed';
import { LiveMatch, Lineup } from '@/types/football';
import { EspnCommentaryEntry, isGoalEvent, isKeyEvent } from '@/lib/espn-api';

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
  const lastSeqRef = useRef(0);

  const [minute, setMinute] = useState<number>(0);
  const [homeGoals, setHomeGoals] = useState<number | null>(null);
  const [awayGoals, setAwayGoals] = useState<number | null>(null);
  const [commentary, setCommentary] = useState<EspnCommentaryEntry[]>([]);

  // Inject player roster once after session connects
  useEffect(() => {
    if (status !== 'connected' || rosterInjected.current) return;
    rosterInjected.current = true;

    fetch(`/api/match/${MATCH_ID}/lineups`)
      .then((r) => r.json())
      .then((lineups: Lineup[]) => {
        if (!lineups?.length) return;
        const text = `CONTEXT: Full player roster with IDs for this match:\n${buildRosterText(lineups)}\nUse these IDs when calling getPlayerStats.`;
        injectContext(text);
      })
      .catch((err) => console.error('[match-client] Lineup fetch failed:', err));
  }, [status, injectContext]);

  // Reset state flags on disconnect so reconnect re-injects everything fresh
  useEffect(() => {
    if (status === 'disconnected') {
      rosterInjected.current = false;
      lastSeqRef.current = 0;
    }
  }, [status]);

  // Poll live match status every 30s
  useEffect(() => {
    async function fetchMinute() {
      try {
        const res = await fetch('/api/matches/live');
        if (!res.ok) return;
        const matches: LiveMatch[] = await res.json();
        const match = matches.find((m) => String(m.fixture.id) === MATCH_ID);
        if (match?.fixture.status.elapsed != null) setMinute(match.fixture.status.elapsed);
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

  // Poll commentary every 30s — update feed and inject new entries into agent
  useEffect(() => {
    async function fetchCommentary() {
      try {
        const res = await fetch('/api/commentary');
        if (!res.ok) return;
        const entries: EspnCommentaryEntry[] = await res.json();
        if (!Array.isArray(entries) || entries.length === 0) return;

        setCommentary(entries);
        console.log(`[commentary] fetched ${entries.length} entries, lastSeq=${lastSeqRef.current}, status=${status}`);

        if (status !== 'connected') return;

        if (lastSeqRef.current === 0) {
          // First load — just record the sequence, agent fetches context on demand via getCommentary
          lastSeqRef.current = entries[entries.length - 1].sequence;
          console.log(`[commentary] first load — seq set to ${lastSeqRef.current}, no injection`);
          return;
        }

        // On subsequent polls: find new entries since last seen
        const newEntries = entries.filter((e) => e.sequence > lastSeqRef.current);
        if (newEntries.length === 0) {
          console.log('[commentary] no new entries since last poll');
          return;
        }

        console.log(`[commentary] ${newEntries.length} new entries (seq ${newEntries[0].sequence}–${newEntries[newEntries.length - 1].sequence})`);
        lastSeqRef.current = newEntries[newEntries.length - 1].sequence;

        const regular = newEntries.filter((e) => !isKeyEvent(e));
        const key = newEntries.filter((e) => isKeyEvent(e));

        // Batch regular commentary as silent context
        if (regular.length > 0) {
          console.log(`[commentary] injecting ${regular.length} regular entries as background context`);
          const text = regular.map((e) => `${e.time?.displayValue ?? '?'}: ${e.text}`).join('\n');
          injectContext(`LIVE COMMENTARY:\n${text}`);
        }

        // Key events (goals, subs, cards) trigger agent announcement
        for (const entry of key) {
          const prefix = isGoalEvent(entry) ? 'SYSTEM: GOAL — ' : 'SYSTEM: ';
          console.log(`[commentary] key event → ${prefix}${entry.text}`);
          injectContext(`${prefix}${entry.text}`);
        }
      } catch (err) {
        console.warn('[match-client] Commentary fetch failed:', err);
      }
    }

    fetchCommentary();
    const interval = setInterval(fetchCommentary, 30_000);
    return () => clearInterval(interval);
  }, [status, injectContext]);

  function handleOrbClick() {
    if (status === 'disconnected' || status === 'error') {
      connect();
    } else if (isConnected) {
      toggleMute();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col py-12 px-4">
      <MatchHeader minute={minute} homeGoals={homeGoals} awayGoals={awayGoals} />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        {/* Left: orb + controls */}
        <div className="flex flex-col items-center justify-center gap-6">
          <VoiceOrb state={orbState} onClick={handleOrbClick} />

          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

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

        {/* Right: commentary feed */}
        <div className="border border-white/10 rounded-2xl p-4 bg-white/[0.02] min-h-[400px] lg:min-h-0">
          <CommentaryFeed entries={commentary} />
        </div>
      </div>
    </div>
  );
}
