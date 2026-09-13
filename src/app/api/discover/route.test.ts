import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/zhihu', () => ({
  searchZhihu: vi.fn(),
  ZhihuQuotaError: class ZhihuQuotaError extends Error {},
}));

import { searchZhihu } from '@/lib/zhihu';
import { POST } from './route';
import type { ZhihuSearchItem } from '@/lib/types';

function makeItem(overrides: Partial<ZhihuSearchItem>): ZhihuSearchItem {
  return {
    Title: 'title',
    ContentType: 'answer',
    ContentID: 'id-1',
    ContentText: 'this is a long enough content snippet for the test',
    Url: 'https://www.zhihu.com/answer/1',
    CommentCount: 0,
    VoteUpCount: 10,
    AuthorName: 'author-a',
    AuthorAvatar: '',
    AuthorBadge: '',
    AuthorBadgeText: '',
    EditTime: 0,
    AuthorityLevel: '1',
    ...overrides,
  };
}

function makeRequest(situation: string) {
  return new NextRequest('http://localhost/api/discover', {
    method: 'POST',
    body: JSON.stringify({ situation }),
  });
}

beforeEach(() => {
  vi.mocked(searchZhihu).mockReset();
});

describe('POST /api/discover', () => {
  it('returns notFound with EmptyReason when there are no results', async () => {
    vi.mocked(searchZhihu).mockResolvedValue({ items: [], emptyReason: '没有找到相关内容' });

    const response = await POST(makeRequest('我在纠结要不要去南极科考'));
    const data = await response.json();

    expect(data.notFound).toBe(true);
    expect(data.emptyReason).toBe('没有找到相关内容');
    expect(data.candidates).toHaveLength(0);
  });

  it('dedupes by author and caps at 8 candidates', async () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      makeItem({
        ContentID: String(i),
        AuthorName: `author-${i}`,
        VoteUpCount: i,
        ContentText: '这是一段关于读研还是工作的真实经历分享，内容足够长',
      }),
    );
    vi.mocked(searchZhihu).mockResolvedValue({ items, emptyReason: undefined });

    const response = await POST(makeRequest('要不要读研'));
    const data = await response.json();

    expect(data.notFound).toBe(false);
    expect(data.candidates.length).toBeLessThanOrEqual(8);
  });

  it('treats API results with no real overlap as not found', async () => {
    const items = [
      makeItem({ ContentText: '这是一段和处境完全无关的知乎内容，但长度足够通过长度检查' }),
    ];
    vi.mocked(searchZhihu).mockResolvedValue({ items, emptyReason: undefined });

    const response = await POST(makeRequest('我在纠结要不要去南极科考'));
    const data = await response.json();

    expect(data.notFound).toBe(true);
    expect(data.candidates).toHaveLength(0);
  });

  it('returns 400 when situation is missing', async () => {
    const response = await POST(makeRequest(''));
    expect(response.status).toBe(400);
  });
});
