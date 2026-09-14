import Link from 'next/link';
import { Waveform } from '@/components/Waveform';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Waveform seed="404" variant="flat" bars={20} size={22} />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl text-paper">这个页面不存在</h1>
        <p className="text-sm leading-relaxed text-paper-dim">链接可能打错了，或者页面已经不在了。</p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-ember px-8 py-3 font-medium text-ink transition-transform duration-200 hover:scale-[1.03]"
      >
        回到首页
      </Link>
    </main>
  );
}
