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


export const agent = new RealtimeAgent({
  name: 'Match AI',
  voice: VOICE,
  instructions: INSTRUCTIONS,
  tools: [getMatchStats, getLiveEvents, getLineups, getPlayerStats, searchPlayer],
});
