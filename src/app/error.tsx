'use client';

import { Waveform } from '@/components/Waveform';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Waveform seed="error" variant="flat" bars={20} size={22} />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl text-paper">出了点问题</h1>
        <p className="text-sm leading-relaxed text-paper-dim">页面加载失败了，试着刷新一下。</p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-ember px-8 py-3 font-medium text-ink transition-transform duration-200 hover:scale-[1.03]"
      >
        重试
      </button>
    </main>
  );
}
