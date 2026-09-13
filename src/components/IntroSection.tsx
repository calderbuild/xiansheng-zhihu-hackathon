'use client';

import { useState } from 'react';
import { Waveform } from './Waveform';

interface IntroSectionProps {
  initialSituation: string;
  error: string | null;
  onSubmit: (situation: string) => void;
}

export function IntroSection({ initialSituation, error, onSubmit }: IntroSectionProps) {
  const [situation, setSituation] = useState(initialSituation);

  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <Waveform seed="intro" variant="idle" bars={20} size={22} />

      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl leading-snug text-paper sm:text-4xl">
          你正纠结要不要做的事，
          <br />
          有人已经做过。
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-paper-dim">
          说说你的处境，我们去知乎上，找找已经做过这件事的真实的人。
        </p>
      </div>

      <form
        className="flex w-full max-w-lg flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (situation.trim()) onSubmit(situation.trim());
        }}
      >
        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="比如：我在纠结要不要裸辞去创业"
          rows={3}
          className="w-full resize-none rounded-md border border-ink-line bg-ink-raised px-4 py-3 text-left text-base text-paper placeholder:text-paper-dim/70"
        />
        {error && (
          <p role="alert" className="text-left text-sm text-brick">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!situation.trim()}
          className="self-center rounded-full bg-ember px-8 py-3 font-medium text-ink transition-transform duration-200 hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
        >
          去找人 →
        </button>
      </form>
    </section>
  );
}
