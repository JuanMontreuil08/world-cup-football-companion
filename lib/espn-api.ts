export interface EspnCommentaryEntry {
  sequence: number;
  time?: { value: number; displayValue: string };
  text: string;
  play?: {
    type?: { id: string; text: string; type: string };
    team?: { displayName: string };
  };
}

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';

export async function fetchEspnCommentary(
  league: string,
  eventId: string
): Promise<EspnCommentaryEntry[]> {
  const res = await fetch(`${ESPN_BASE}/${league}/summary?event=${eventId}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`ESPN API ${res.status}`);
  const json = await res.json();
  return (json.commentary ?? []) as EspnCommentaryEntry[];
}

export function isGoalEvent(entry: EspnCommentaryEntry): boolean {
  const type = entry.play?.type?.type ?? '';
  return type === 'goal' || type.startsWith('goal---') || type === 'penalty---scored';
}

export function isKeyEvent(entry: EspnCommentaryEntry): boolean {
  const type = entry.play?.type?.type ?? '';
  return isGoalEvent(entry) || type === 'substitution' || type.includes('card');
}
