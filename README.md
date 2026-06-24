# Mundial

AI-powered FIFA World Cup 2026 match companion. Talk to it, ask about the match, and watch it find goal clips on YouTube using computer vision.

## What it does

- **Live match data** — scores, stats, lineups, play-by-play commentary via ESPN
- **Voice AI analyst** — OpenAI Realtime API agent you talk to in any language. Ask "who scored?" or "¿cómo está jugando Portugal?" and it answers with live data
- **Computer Use (CUA)** — say "show me the goal" and GPT-5.5 opens a browser, searches YouTube, and plays the clip using AI vision. Say "stop" to pause, "close" to return to the match.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **OpenAI Realtime API** — voice agent (`gpt-realtime-2`)
- **OpenAI Responses API** — computer use (`gpt-5.5`)
- **Playwright** — browser automation for CUA
- **ESPN public API** — match data, commentary, lineups, stats
- **Perplexity Sonar** — web search for player/club info

## Setup

```bash
pnpm install
cp .env.local.example .env.local  # fill in your keys
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment variables

```env
OPENAI_API_KEY=          # OpenAI API key (Realtime + CUA)
PERPLEXITY_API_KEY=      # Perplexity Sonar (web search tool)
API_FOOTBALL_KEY=        # api-sports.io key (live match detection)
ESPN_EVENT_ID=           # optional default event ID for commentary
```

## Project structure

```
app/
  page.tsx                      # Match schedule
  match/[eventId]/page.tsx      # Match detail (tabs: AI, lineups, stats, news)
  api/
    commentary/                 # ESPN play-by-play, condensed for AI
    espn/match/[eventId]/       # events, stats, lineups, news
    live-scores/                # score polling
    search/player/              # Perplexity web search
    cua/                        # CUA endpoint — launches browser, searches YouTube

lib/
  agent.ts                      # Realtime agent definition + 6 tools
  config.ts                     # Agent instructions, voice, model config
  espn-api.ts                   # ESPN API wrapper + event type helpers
  cua/
    engine.ts                   # CUA loop: GPT-5.5 ↔ screenshot ↔ actions
    browser.ts                  # Playwright BrowserManager
    youtube.ts                  # YouTube search via CUA

components/
  match-client.tsx              # Main match UI + tab routing
  voice-orb.tsx                 # Listening/speaking indicator
  commentary-feed.tsx           # Live play-by-play sidebar
  lineup-tab.tsx / stats-tab.tsx / news-tab.tsx
```

## How CUA works

```
voice command → getLiveEvents (ESPN) → build YouTube query
→ POST /api/cua { query }
→ BrowserManager launches Chrome
→ cuaLoop: GPT-5.5 sees screenshot → outputs actions → executes → screenshots → repeat
→ video plays
```

The model never sees HTML. It reads screenshots like a human and decides where to click, type, or scroll. Up to 20 iterations per task.

## Agent tools

| Tool | Source | Use |
|---|---|---|
| `getLiveEvents` | ESPN | Goals, cards, substitutions |
| `getMatchStats` | ESPN | Possession, shots, passes |
| `getLineups` | ESPN | Formations, starting XI |
| `getCommentary` | ESPN | Play-by-play narrative by time range |
| `searchWeb` | Perplexity | Player clubs, injuries, stadiums |
| `openGoalClip` | CUA + YouTube | Play a goal clip on screen |
| `stopGoalClip` | CUA | Pause the video (browser stays open) |
| `closeGoalClip` | CUA | Close the browser, return to match |
