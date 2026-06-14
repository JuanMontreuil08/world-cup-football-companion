interface Props {
  minute: number;
  homeGoals: number | null;
  awayGoals: number | null;
}

export function MatchHeader({ minute, homeGoals, awayGoals }: Props) {
  return (
    <div className="flex items-center justify-between w-full max-w-sm">
      {/* Home: Germany */}
      <div className="flex flex-col items-center gap-1">
        <img
          src="https://media.api-sports.io/football/teams/25.png"
          alt="Germany"
          className="w-12 h-12 object-contain"
        />
        <span className="text-white text-sm font-semibold">Germany</span>
      </div>

      {/* Score + minute */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-white text-4xl font-bold tracking-tight">{homeGoals ?? 0} – {awayGoals ?? 0}</span>
        <span className="text-white/50 text-xs">{minute}&apos;</span>
      </div>

      {/* Away: Curaçao */}
      <div className="flex flex-col items-center gap-1">
        <img
          src="https://media.api-sports.io/football/teams/1580.png"
          alt="Curaçao"
          className="w-12 h-12 object-contain"
        />
        <span className="text-white text-sm font-semibold">Curaçao</span>
      </div>
    </div>
  );
}
