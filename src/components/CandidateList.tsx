import type { Candidate } from '@/lib/types';
import { parseHighlightSegments } from '@/lib/highlight';
import { Waveform } from './Waveform';

interface CandidateListProps {
  query: string;
  candidates: Candidate[];
  onPick: (candidate: Candidate) => void;
  onRetry: () => void;
}

export function CandidateList({ query, candidates, onPick, onRetry }: CandidateListProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="text-center">
        <p className="text-sm text-paper-dim">
          找到 {candidates.length} 个已经做过这件事的人 · 搜索
          <span className="font-signal text-ember"> “{query}”</span>
        </p>
      </div>

      <ul className="flex flex-col gap-px overflow-hidden rounded-md border border-ink-line">
        {candidates.map((candidate, i) => (
          <CandidateCard key={candidate.contentId} index={i + 1} candidate={candidate} onPick={onPick} />
        ))}
      </ul>

      <button
        type="button"
        onClick={onRetry}
        className="self-center text-sm text-paper-dim underline decoration-ink-line underline-offset-4 transition-colors hover:text-paper"
      >
        换个说法再搜一次
      </button>
    </section>
  );
}

function CandidateCard({
  index,
  candidate,
  onPick,
}: {
  index: number;
  candidate: Candidate;
  onPick: (candidate: Candidate) => void;
}) {
  const segments = parseHighlightSegments(candidate.contentText);

  return (
    <li className="flex flex-col gap-3 bg-ink-raised px-5 py-5 sm:flex-row sm:items-start sm:gap-5">
      <span className="font-signal shrink-0 text-sm text-paper-dim">{String(index).padStart(2, '0')}</span>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-3">
          <Waveform seed={candidate.contentId} variant="settled" bars={12} size={14} />
          <span className="text-sm font-medium text-paper">{candidate.authorName}</span>
          {candidate.authorBadgeText && (
            <span className="text-xs text-paper-dim">{candidate.authorBadgeText}</span>
          )}
        </div>

        <p className="font-display text-lg leading-snug text-paper">{candidate.title}</p>

        <p className="line-clamp-3 text-sm leading-relaxed text-paper-dim">
          {segments.map((seg, i) =>
            seg.highlighted ? (
              <mark key={i} className="bg-transparent font-medium text-ember">
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="font-signal text-xs text-paper-dim">
            赞同 {candidate.voteUpCount} · 评论 {candidate.commentCount}
          </span>
          <div className="flex items-center gap-4">
            <a
              href={candidate.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-paper-dim underline decoration-ink-line underline-offset-4 hover:text-paper"
            >
              查看原文
            </a>
            <button
              type="button"
              onClick={() => onPick(candidate)}
              className="rounded-full bg-ember/90 px-4 py-1.5 text-xs font-medium text-ink transition-transform duration-200 hover:scale-105"
            >
              写开场白 →
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
