import { Waveform } from './Waveform';

interface NotFoundStateProps {
  query: string;
  emptyReason?: string;
  onRetry: () => void;
}

export function NotFoundState({ query, emptyReason, onRetry }: NotFoundStateProps) {
  return (
    <section className="flex flex-col items-center gap-6 py-12 text-center">
      <Waveform seed="not-found" variant="flat" bars={20} size={22} />

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl text-paper">这次没有找到匹配的人</h2>
        <p className="font-signal text-sm text-paper-dim">
          搜索 “{query}”{emptyReason ? ` · ${emptyReason}` : ''}
        </p>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-paper-dim">
          换一种说法，或者说得更具体一点，可能会找到更多相关的人。
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border border-ink-line px-6 py-2.5 text-sm text-paper transition-colors hover:border-ember hover:text-ember"
      >
        换个说法再试试
      </button>
    </section>
  );
}
