import { Waveform } from './Waveform';

export function IcebreakerGenerating({ authorName }: { authorName: string }) {
  return (
    <section className="flex flex-col items-center gap-6 py-16 text-center" role="status" aria-live="polite">
      <Waveform seed="generating" variant="live" bars={24} size={32} />
      <p className="text-sm text-paper-dim">正在根据 {authorName} 的经历，整理一段开场白…</p>
    </section>
  );
}
