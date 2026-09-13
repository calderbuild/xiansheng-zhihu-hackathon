'use client';

import { useState } from 'react';
import type { Candidate } from '@/lib/types';
import { Waveform } from './Waveform';

interface IcebreakerResultProps {
  candidate: Candidate;
  message: string;
  onPickAnother: () => void;
  onStartOver: () => void;
}

function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    );
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve(ok);
}

export function IcebreakerResult({ candidate, message, onPickAnother, onStartOver }: IcebreakerResultProps) {
  const [copied, setCopied] = useState(false);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-3">
        <Waveform seed={candidate.contentId} variant="settled" bars={14} size={16} />
        <span className="font-signal text-xs text-paper-dim">
          基于 {candidate.authorName} 的《{candidate.title}》
        </span>
      </div>

      <blockquote className="rounded-md border border-ink-line bg-ink-raised px-6 py-6 font-display text-lg leading-loose text-paper">
        {message}
      </blockquote>

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={async () => {
            const ok = await copyToClipboard(message);
            if (ok) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="rounded-full bg-ember px-8 py-3 font-medium text-ink transition-transform duration-200 hover:scale-[1.03]"
        >
          {copied ? '已复制' : '复制'}
        </button>

        <div className="flex gap-6 text-sm text-paper-dim">
          <button type="button" onClick={onPickAnother} className="underline decoration-ink-line underline-offset-4 hover:text-paper">
            换一个人
          </button>
          <button type="button" onClick={onStartOver} className="underline decoration-ink-line underline-offset-4 hover:text-paper">
            换个处境重新开始
          </button>
        </div>
      </div>
    </section>
  );
}
