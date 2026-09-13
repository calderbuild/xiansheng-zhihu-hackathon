import { Waveform } from './Waveform';

export function LoadingSearch() {
  return (
    <section className="flex flex-col items-center gap-6 py-16 text-center" role="status" aria-live="polite">
      <Waveform seed="searching" variant="live" bars={24} size={32} />
      <p className="text-sm text-paper-dim">正在知乎上找人…</p>
    </section>
  );
}
