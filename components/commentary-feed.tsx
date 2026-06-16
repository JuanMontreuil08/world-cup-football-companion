'use client';

import { EspnCommentaryEntry, isGoalEvent } from '@/lib/espn-api';

export function CommentaryFeed({ entries }: { entries: EspnCommentaryEntry[] }) {
  const recent = [...entries].reverse().slice(0, 20);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3 px-1">
        Live Commentary
      </h2>
      <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-white/5">
        {recent.length === 0 ? (
          <p className="text-white/20 text-sm px-1 py-4">No commentary yet</p>
        ) : (
          recent.map((entry) => {
            const goal = isGoalEvent(entry);
            return (
              <div
                key={entry.sequence}
                className={`flex gap-3 items-start py-2.5 px-1 ${goal ? 'bg-yellow-500/5' : ''}`}
              >
                <span className="shrink-0 text-xs font-mono w-10 text-right pt-0.5 text-white/30">
                  {entry.time?.displayValue ?? '—'}
                </span>
                <p className={`text-sm leading-snug ${goal ? 'text-yellow-300 font-medium' : 'text-white/60'}`}>
                  {entry.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
