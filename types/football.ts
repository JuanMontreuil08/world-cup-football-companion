export interface LiveMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string; // 'LIVE' | '1H' | '2H' | 'HT' | 'FT' | 'NS' | ...
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
  };
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface MatchEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string; // 'Normal Goal' | 'Yellow Card' | 'Red Card' | 'Penalty' | ...
  comments: string | null;
}

export interface MatchStat {
  team: { id: number; name: string; logo: string };
  statistics: Array<{ type: string; value: string | number | null }>;
}

export interface Lineup {
  team: { id: number; name: string; logo: string };
  formation: string;
  startXI: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
  substitutes: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
  coach: { id: number; name: string; photo: string };
}
