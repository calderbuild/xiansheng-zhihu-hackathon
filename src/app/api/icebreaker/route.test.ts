import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/zhihu', () => ({
  askZhida: vi.fn(),
  ZhihuQuotaError: class ZhihuQuotaError extends Error {},
}));

vi.mock('@/lib/openai-fallback', () => ({
  askOpenAiNextFallback: vi.fn(),
}));

import { askZhida, ZhihuQuotaError } from '@/lib/zhihu';
import { askOpenAiNextFallback } from '@/lib/openai-fallback';
import { POST } from './route';
import type { Candidate } from '@/lib/types';

const candidate: Candidate = {
  contentId: 'c1',
  title: '我裸辞去创业的这一年',
  contentText: '我在裸辞之后先做了三个月的市场调研，然后才正式启动。',
  url: 'https://www.zhihu.com/answer/1',
  authorName: '一个创业者',
  authorAvatar: '',
  authorBadgeText: '',
  voteUpCount: 100,
  commentCount: 3,
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/icebreaker', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(askZhida).mockReset();
  vi.mocked(askOpenAiNextFallback).mockReset();
});

describe('POST /api/icebreaker', () => {
  it('grounds the prompt in the candidate real content', async () => {
    vi.mocked(askZhida).mockResolvedValue('生成的开场白');

    const response = await POST(makeRequest({ candidate, situation: '我在纠结要不要裸辞去创业' }));
    const data = await response.json();

    expect(data.message).toBe('生成的开场白');

    const [messages] = vi.mocked(askZhida).mock.calls[0];
    const userMessage = messages.find((m) => m.role === 'user')!.content;
    expect(userMessage).toContain('我在裸辞之后先做了三个月的市场调研');
    expect(userMessage).toContain(candidate.url);
  });

  it('returns 400 when situation is missing', async () => {
    const response = await POST(makeRequest({ candidate }));
    expect(response.status).toBe(400);
  });

  it('falls back to openai-next when zhida quota is exhausted', async () => {
    vi.mocked(askZhida).mockRejectedValue(new ZhihuQuotaError(30001, 'quota exceeded'));
    vi.mocked(askOpenAiNextFallback).mockResolvedValue('备用生成的开场白');

    const response = await POST(makeRequest({ candidate, situation: '我在纠结要不要辞职去读研' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('备用生成的开场白');
  });

  it('returns 429 when both zhida and the fallback fail', async () => {
    vi.mocked(askZhida).mockRejectedValue(new ZhihuQuotaError(30001, 'quota exceeded'));
    vi.mocked(askOpenAiNextFallback).mockRejectedValue(new Error('fallback down'));

    const response = await POST(makeRequest({ candidate, situation: '我在纠结要不要转专业' }));
    expect(response.status).toBe(429);
  });
});
