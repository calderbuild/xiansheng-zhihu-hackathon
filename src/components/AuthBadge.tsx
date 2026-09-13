'use client';

import { useEffect, useState } from 'react';
import type { SessionStatus } from '@/lib/types';
import { Waveform } from './Waveform';

const AUTH_MESSAGES: Record<string, string> = {
  denied: '已取消登录。',
  'failed-state': '登录状态已过期，请重新登录。',
  'failed-exchange': '登录未完成，请重新登录；如果多次失败，可能是账号未绑定手机号或未完成实名认证。',
};

export function AuthBadge() {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data: SessionStatus) => setStatus(data))
      .catch(() => setStatus({ connected: false }));

    // reading window.location must stay in an effect (SSR has no window), but a bare
    // setState call here trips react-hooks/set-state-in-effect; queueMicrotask keeps
    // this a same-tick, mount-only read while matching the async-callback shape the
    // rule expects.
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      if (auth && AUTH_MESSAGES[auth]) {
        setMessage(AUTH_MESSAGES[auth]);
        params.delete('auth');
        const query = params.toString();
        window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
      }
    });
  }, []);

  if (!status) return null;

  return (
    <div className="flex flex-col items-end gap-1 font-signal text-xs text-paper-dim">
      {status.connected && status.user ? (
        <div className="flex items-center gap-2">
          <Waveform seed={status.user.uid} variant="settled" bars={6} size={10} />
          {status.user.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={status.user.avatarUrl}
              alt={status.user.name ?? '已登录知乎账号'}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="h-5 w-5 rounded-full object-cover"
            />
          )}
          <span className="text-paper">{status.user.name || '知乎用户'}</span>
          <a href="/api/auth/logout" className="text-paper-dim underline decoration-ink-line underline-offset-4 hover:text-paper">
            退出
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-0.5">
          <a href="/api/auth/login" className="text-paper-dim underline decoration-ink-line underline-offset-4 hover:text-ember">
            登录知乎
          </a>
          <span className="text-paper-dim/70">需要绑定手机号并完成实名认证的知乎账号</span>
        </div>
      )}
      {message && (
        <p role="alert" className="text-brick">
          {message}
        </p>
      )}
    </div>
  );
}
