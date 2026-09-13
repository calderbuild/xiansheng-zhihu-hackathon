import { NextRequest, NextResponse } from 'next/server';
import { searchZhihu, ZhihuQuotaError } from '@/lib/zhihu';
import { deriveSearchQuery, dedupeCandidates } from '@/lib/query';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';
import type { DiscoverRequest, DiscoverResponse } from '@/lib/types';

const MAX_CANDIDATES = 8;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as DiscoverRequest | null;
  const situation = body?.situation?.trim();

  if (!situation) {
    return NextResponse.json({ error: 'situation is required' }, { status: 400 });
  }

  const query = deriveSearchQuery(situation);
  const cacheKey = `search:${query}`;

  try {
    let result = cacheGet<{ items: Awaited<ReturnType<typeof searchZhihu>>['items']; emptyReason?: string }>(
      cacheKey,
    );

    if (!result) {
      result = await searchZhihu(query, 10);
      cacheSet(cacheKey, result, TTL.SEARCH);
    }

    const candidates = dedupeCandidates(result.items, query).slice(0, MAX_CANDIDATES);

    const response: DiscoverResponse = {
      query,
      candidates,
      notFound: candidates.length === 0,
      emptyReason: candidates.length === 0 ? result.emptyReason : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ZhihuQuotaError) {
      return NextResponse.json(
        { error: '知乎搜索接口今日额度已用完，请稍后再试' },
        { status: 429 },
      );
    }
    console.error('discover route failed', error);
    return NextResponse.json({ error: '搜索暂时不可用，请稍后再试' }, { status: 502 });
  }
}
