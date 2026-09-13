import { Waveform } from './Waveform';

export function VideoIntro() {
  return (
    <section className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 font-signal text-xs uppercase tracking-widest text-paper-dim">
        <Waveform seed="video-intro" variant="idle" bars={10} size={10} />
        产品演示 · 52s
      </div>
      <video
        className="w-full rounded-md border border-ink-line bg-ink-raised"
        poster="/videos/xiansheng-intro-poster.jpg"
        controls
        preload="none"
        playsInline
      >
        <source src="/videos/xiansheng-intro.mp4" type="video/mp4" />
      </video>
    </section>
  );
}
