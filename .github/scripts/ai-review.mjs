import fs from 'fs';
import path from 'path';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const REVIEW_FOCUS = process.env.REVIEW_FOCUS || 'all';

if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is required');
if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is required');

// ─── File reader ────────────────────────────────────────────────────────────

const FILES_TO_READ = [
  'package.json',
  'lib/config.ts',
  'lib/agent.ts',
  'lib/football-api.ts',
  'hooks/use-match-session.ts',
  'components/match-client.tsx',
  'components/match-header.tsx',
  'components/voice-orb.tsx',
  'app/server/token.action.ts',
  'app/api/search/player/route.ts',
  'app/api/match/[id]/stats/route.ts',
  'app/api/match/[id]/events/route.ts',
  'app/api/match/[id]/lineups/route.ts',
  'app/api/match/[id]/player/[pid]/route.ts',
  'app/api/matches/live/route.ts',
];

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
  } catch {
    return null;
  }
}

function buildCodeContext() {
  const parts = [];
  for (const file of FILES_TO_READ) {
    const content = readFile(file);
    if (content) parts.push(`### ${file}\n\`\`\`\n${content}\n\`\`\``);
  }
  return parts.join('\n\n');
}

// ─── Perplexity search ───────────────────────────────────────────────────────

async function perplexitySearch(query) {
  if (!PERPLEXITY_API_KEY) {
    console.warn(`Skipping search (no PERPLEXITY_API_KEY): ${query}`);
    return null;
  }

  try {
    const res = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, search_context_size: 'high' }),
    });

    if (!res.ok) {
      console.warn(`Perplexity search failed for "${query}": ${res.status}`);
      return null;
    }

    const data = await res.json();
    const answer = data.answer ?? '';
    const sources = (data.sources ?? data.results ?? [])
      .slice(0, 4)
      .map((r) => `- ${r.title}: ${r.snippet ?? r.text ?? ''}`)
      .join('\n');

    return answer ? `${answer}\n\nSources:\n${sources}` : sources;
  } catch (err) {
    console.warn(`Perplexity search error: ${err.message}`);
    return null;
  }
}

async function gatherMarketResearch() {
  console.log('Running market research searches...');

  const [footballApis, visionModels, voiceAlternatives] = await Promise.all([
    perplexitySearch(
      'best football data API 2025: alternatives to API-Football, free tier limits, real-time data quality — compare football-data.org, SportMonks, OpenLigaDB, TheSportsDB'
    ),
    perplexitySearch(
      'real-time sports video narration AI 2025: using vision models GPT-4o vision, Gemini Flash, Claude vision for live video frame analysis and voice commentary — latency, cost, feasibility'
    ),
    perplexitySearch(
      'WebRTC voice AI alternatives to OpenAI Realtime API 2025: ElevenLabs conversational AI, Hume AI, Daily.co, Livekit agents — latency and cost comparison'
    ),
  ]);

  return { footballApis, visionModels, voiceAlternatives };
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

function buildPrompt(focus, codeContext, research) {
  const today = new Date().toISOString().split('T')[0];

  const researchSection = `
## Market Research (from live web search — ${today})

### Football Data APIs
${research.footballApis ?? '_Search unavailable — use your own knowledge_'}

### Real-Time Vision Narration Models
${research.visionModels ?? '_Search unavailable — use your own knowledge_'}

### Voice AI Alternatives
${research.voiceAlternatives ?? '_Search unavailable — use your own knowledge_'}
`;

  const issuesSection = `
## Section A — Bugs & Issues
For each bug found:
- **File + line**
- **What breaks** and under what condition
- **Fix** (concrete, 1–3 lines if possible)
- **Priority**: 🔴 High / 🟡 Medium / 🟢 Low
`;

  const enhancementsSection = `
## Section B — Service Replacements & Enhancements
Use the market research above to answer:

1. **Football Data API** — API-Football free tier is limited to 100 req/day with ~1-2min delay. Based on the research, what is the best replacement? Include: free tier limits, real-time latency, pricing, migration effort.

2. **Voice AI** — Is @openai/agents/realtime + gpt-realtime-2 still the best option, or is there a simpler/cheaper alternative with similar latency?

3. **Player search** — Is Perplexity the best web search tool for player data, or are Tavily/Exa/you.com better for this use case?

4. **Code improvements** — Design patterns or Next.js 15 patterns that simplify the existing code. Specifically address the known bug: React status state never reaches 'connected' even though WebRTC audio works fine.
`;

  const visionSection = `
## Section C — Vision Model Roadmap (Mid-Term)
The project goal is to evolve into a real-time AI narrator that watches the match video and narrates what it sees — combining vision + voice AI.

Based on the research, provide:
1. **Feasibility today** — can this be done now? What are the blockers (latency, cost, API availability)?
2. **Recommended approach** — which vision model, how to capture video frames (screen capture, broadcast stream, etc.), how to feed into the existing voice session
3. **Step-by-step path** — 3–5 concrete milestones from where the project is today to real-time vision narration
4. **Estimated effort per milestone** — S (days) / M (weeks) / L (months)
`;

  let focusSections = '';
  if (focus === 'issues') focusSections = issuesSection;
  else if (focus === 'enhancements') focusSections = enhancementsSection + visionSection;
  else focusSections = issuesSection + enhancementsSection + visionSection;

  return `You are a senior engineer reviewing Match AI — a Next.js 15 voice AI football companion for World Cup 2026.

Current stack:
- OpenAI Realtime API (gpt-realtime-2) via @openai/agents/realtime SDK
- WebRTC for browser ↔ OpenAI audio
- API-Football v3 for live match data (100 req/day free tier, ~1-2min delay)
- Perplexity Search API for player web search
- Next.js 15 App Router + Server Actions

${researchSection}

---

## Codebase

${codeContext}

---

## Your Task

Produce a structured report. Start with this exact header block:

---
## 📋 Executive Summary
[3 bullet points: biggest issue, biggest opportunity, most important next step]

## ⚡ Action Items
| Priority | What | Where | Effort |
|----------|------|-------|--------|
[Fill this table with the top 6–8 actionable items across all sections. Effort: S=days, M=weeks, L=months]

---

Then write the full detail sections below:

${focusSections}

**Format rules:**
- Use 🔴 🟡 🟢 for priority on every finding
- Be specific: file names, line numbers, API names, pricing
- Keep each finding to: Problem → Impact → Fix/Action
- The Action Items table at the top must be a true summary of what's below — no new items`;
}

// ─── Claude call ─────────────────────────────────────────────────────────────

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// ─── GitHub helpers ───────────────────────────────────────────────────────────

async function getOpenIssues() {
  const [owner, repo] = GITHUB_REPOSITORY.split('/');
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?labels=ai-review&state=open&per_page=5`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );
  if (!res.ok) return [];
  return res.json();
}

async function createGitHubIssue(title, body, labels) {
  const [owner, repo] = GITHUB_REPOSITORY.split('/');
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({ title, body, labels }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${err}`);
  }

  const issue = await res.json();
  return issue.html_url;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Running AI review — focus: ${REVIEW_FOCUS}`);

  // Check for recent open issues to avoid duplicates
  const openIssues = await getOpenIssues();
  if (openIssues.length >= 3) {
    console.log(`${openIssues.length} open ai-review issues already exist — skipping to avoid noise.`);
    return;
  }

  // Gather market research and code in parallel
  const [research, codeContext] = await Promise.all([
    gatherMarketResearch(),
    Promise.resolve(buildCodeContext()),
  ]);

  console.log('Calling Claude...');
  const prompt = buildPrompt(REVIEW_FOCUS, codeContext, research);
  const review = await callClaude(prompt);
  console.log('Review received');

  const dateStr = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const focusLabel =
    REVIEW_FOCUS === 'issues' ? 'Issues' :
    REVIEW_FOCUS === 'enhancements' ? 'Enhancements' :
    'Full Review';

  const title = `[AI Review] ${focusLabel} — ${dateStr}`;
  const body = `> Auto-generated · Focus: **${REVIEW_FOCUS}** · ${dateStr}\n\n${review}`;
  const labels = ['ai-review'];

  const issueUrl = await createGitHubIssue(title, body, labels);
  console.log(`Issue created: ${issueUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
