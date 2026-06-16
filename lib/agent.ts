import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { INSTRUCTIONS, VOICE } from './config';

const getMatchStats = tool({
  name: 'getMatchStats',
  description: 'Get current match statistics (possession, shots, passes, fouls, etc.)',
  parameters: z.object({
    matchId: z.string().describe('The fixture ID'),
  }),
  execute: async ({ matchId }) => {
    const res = await fetch(`/api/match/${matchId}/stats`);
    if (!res.ok) throw new Error('Failed to fetch match stats');
    return res.json();
  },
});

const getLiveEvents = tool({
  name: 'getLiveEvents',
  description: 'Get the full event timeline for the match (goals, cards, substitutions)',
  parameters: z.object({
    matchId: z.string().describe('The fixture ID'),
  }),
  execute: async ({ matchId }) => {
    const res = await fetch(`/api/match/${matchId}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },
});

const getLineups = tool({
  name: 'getLineups',
  description: 'Get the starting lineups and formations for both teams',
  parameters: z.object({
    matchId: z.string().describe('The fixture ID'),
  }),
  execute: async ({ matchId }) => {
    const res = await fetch(`/api/match/${matchId}/lineups`);
    if (!res.ok) throw new Error('Failed to fetch lineups');
    return res.json();
  },
});

const getPlayerStats = tool({
  name: 'getPlayerStats',
  description: 'Get detailed in-match statistics for a specific player',
  parameters: z.object({
    matchId: z.string().describe('The fixture ID'),
    playerId: z.string().describe('The player ID'),
  }),
  execute: async ({ matchId, playerId }) => {
    const res = await fetch(`/api/match/${matchId}/player/${playerId}`);
    if (!res.ok) throw new Error('Failed to fetch player stats');
    return res.json();
  },
});

const searchPlayer = tool({
  name: 'searchPlayer',
  description: 'Search the web for current information about a player: recent form, season stats, club news, injuries, transfer rumors. Use this when getPlayerStats does not have enough context or for questions about a player\'s current season or club.',
  parameters: z.object({
    query: z.string().describe('Natural language search query, e.g. "Kai Havertz 2025-26 season goals Arsenal"'),
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
    fromMinute: z.number().optional().describe('Start of time range in minutes (inclusive)'),
    toMinute: z.number().optional().describe('End of time range in minutes (inclusive)'),
  }),
  execute: async ({ fromMinute, toMinute }) => {
    const params = new URLSearchParams();
    if (fromMinute !== undefined) params.set('from', String(fromMinute));
    if (toMinute !== undefined) params.set('to', String(toMinute));
    const url = `/api/commentary${params.size > 0 ? `?${params}` : ''}`;
    console.log(`[agent] getCommentary called — ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch commentary');
    const entries = await res.json();
    console.log(`[agent] getCommentary returned ${Array.isArray(entries) ? entries.length : '?'} entries`);
    return entries;
  },
});

export const agent = new RealtimeAgent({
  name: 'Match AI',
  voice: VOICE,
  instructions: INSTRUCTIONS,
  tools: [getMatchStats, getLiveEvents, getLineups, getPlayerStats, searchPlayer, getCommentary],
});
