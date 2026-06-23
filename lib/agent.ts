import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { INSTRUCTIONS, VOICE } from './config';

const getMatchStats = tool({
  name: 'getMatchStats',
  description: 'Get current match statistics (possession, shots, passes, fouls, etc.)',
  parameters: z.object({
    matchId: z.string().describe('The fixture ID from the match context'),
  }),
  execute: async ({ matchId }) => {
    const res = await fetch(`/api/espn/match/${matchId}/stats`);
    if (!res.ok) throw new Error('Failed to fetch match stats');
    return res.json();
  },
});

const getLiveEvents = tool({
  name: 'getLiveEvents',
  description: 'Get the full event timeline for the match (goals, cards, substitutions)',
  parameters: z.object({
    matchId: z.string().describe('The fixture ID from the match context'),
  }),
  execute: async ({ matchId }) => {
    const res = await fetch(`/api/espn/match/${matchId}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },
});

const getLineups = tool({
  name: 'getLineups',
  description: 'Get the starting lineups and formations for both teams',
  parameters: z.object({
    matchId: z.string().describe('The fixture ID from the match context'),
  }),
  execute: async ({ matchId }) => {
    const res = await fetch(`/api/espn/match/${matchId}/lineups`);
    if (!res.ok) throw new Error('Failed to fetch lineups');
    return res.json();
  },
});


const searchWeb = tool({
  name: 'searchWeb',
  description: 'Search the web for any current information: player stats, clubs, injuries, transfers, stadiums, match context, World Cup facts, referee info, or anything not available from the other tools.',
  parameters: z.object({
    query: z.string().describe('Natural language search query, e.g. "Kai Havertz Arsenal 2026 goals" or "Hard Rock Stadium Miami capacity"'),
  }),
  execute: async ({ query }) => {
    const res = await fetch(`/api/search/player?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },
});

const getCommentary = tool({
  name: 'getCommentary',
  description: 'Get play-by-play commentary for the match — shots, saves, fouls, goals, subs. Use fromMinute/toMinute for time-range questions ("first 10 minutes" → from=0,to=10; "second half" → from=45,to=90). Omit both for the most recent events. After retrieving, narrate like a pundit: dominant team, key players, shots, pressure, turning points — not just goals.',
  parameters: z.object({
    matchId: z.string().describe('The fixture ID from the match context'),
    fromMinute: z.number().optional().describe('Start of time range in minutes (inclusive)'),
    toMinute: z.number().optional().describe('End of time range in minutes (inclusive)'),
  }),
  execute: async ({ matchId, fromMinute, toMinute }) => {
    const params = new URLSearchParams({ eventId: matchId });
    if (fromMinute !== undefined) params.set('from', String(fromMinute));
    if (toMinute !== undefined) params.set('to', String(toMinute));
    const url = `/api/commentary?${params}`;
    console.log(`[agent] getCommentary called — ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch commentary');
    const entries = await res.json();
    console.log(`[agent] getCommentary returned ${Array.isArray(entries) ? entries.length : '?'} entries`);
    return entries;
  },
});

const openMatchStream = tool({
  name: 'openMatchStream',
  description: 'Open Paramount+ in a browser and navigate to a specific moment in a live match. Use when the user wants to WATCH, SEE, or SHOW a goal, play, or moment from the match.',
  parameters: z.object({
    homeTeam: z.string().describe('Home team name'),
    awayTeam: z.string().describe('Away team name'),
    minute: z.number().optional().describe('Minute to seek to (omit for live stream)'),
  }),
  execute: async ({ homeTeam, awayTeam, minute }) => {
    const res = await fetch('/api/cua', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeTeam, awayTeam, minute }),
    });
    if (!res.ok) throw new Error('Failed to open stream');
    return res.json();
  },
});

export const agent = new RealtimeAgent({
  name: 'Match AI',
  voice: VOICE,
  instructions: INSTRUCTIONS,
  tools: [getMatchStats, getLiveEvents, getLineups, searchWeb, getCommentary, openMatchStream],
});
