'use client';

import { voiceprintHeights } from '@/lib/waveform';

interface WaveformProps {
  seed: string;
  bars?: number;
  size?: number;
  variant: 'idle' | 'live' | 'settled' | 'flat';
  className?: string;
}

export function Waveform({ seed, bars = 24, size = 28, variant, className = '' }: WaveformProps) {
  const heights = variant === 'flat' ? Array(bars).fill(0.08) : voiceprintHeights(seed, bars);

  return (
    <div className={`flex items-end justify-center gap-[3px] ${className}`} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`waveform-bar w-[3px] rounded-full bg-ember ${variant === 'live' ? 'waveform-bar--live' : ''}`}
          style={
            variant === 'live'
              ? { height: `${size}px`, animationDelay: `${(i % 8) * 0.09}s` }
              : { height: `${size}px`, transform: `scaleY(${h})` }
          }
        />
      ))}
    </div>
  );
}
