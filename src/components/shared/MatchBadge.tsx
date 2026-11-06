import React from 'react';
import { MatchScoreResult } from '@/types';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchBadgeProps {
  match: MatchScoreResult;
  showDetails?: boolean;
  className?: string;
}

export function MatchBadge({ match, showDetails = false, className }: MatchBadgeProps) {
  let colorStyles = "bg-[#D8E3D0] text-[#31594B] border-[#C8D9C2]";

  if (match.score >= 85) {
    colorStyles = "bg-[#EAF0E8] text-[#31594B] border-[#C8D9C2]";
  } else if (match.score >= 70) {
    colorStyles = "bg-[#FBF4EC] text-[#8C5323] border-[#F3E5D8]";
  } else {
    colorStyles = "bg-[#F4F1E8] text-[#68716B] border-[#E3E2D9]";
  }

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border tracking-tight shadow-2xs",
          colorStyles
        )}
        title="Rule-based score calculated from skill overlap and declared interests"
      >
        <span>{match.score}% Match</span>
        <span className="text-[10px] opacity-75 font-normal">· {match.label}</span>
      </div>

      {showDetails && (
        <div className="text-[11px] text-[#68716B] flex items-center gap-1 mt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#31594B] shrink-0" />
          <span>{match.explanation}</span>
        </div>
      )}
    </div>
  );
}
