import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { askZhida, ZhihuQuotaError } from '@/lib/zhihu';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';
import type { IcebreakerRequest, IcebreakerResponse } from '@/lib/types';

const SYSTEM_PROMPT = `你在帮一个知乎用户写"第一次私信"的开场白。只能引用下面提供的真实内容里的具体细节，
不许编造对方没说过的经历；输出 3-5 句可直接复制发送的中文文本；
结尾用一个具体问题邀请对方回复；不要说"这是AI生成的"。`;

function hashSituation(situation: string) {
  return createHash('sha1').update(situation).digest('hex').slice(0, 12);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as IcebreakerRequest | null;
  const candidate = body?.candidate;
  const situation = body?.situation?.trim();

  if (!candidate || !situation) {
    return NextResponse.json({ error: 'candidate and situation are required' }, { status: 400 });
  }

  const cacheKey = `icebreaker:${candidate.contentId}:${hashSituation(situation)}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) {
    return NextResponse.json({ message: cached } satisfies IcebreakerResponse);
  }

  const userPrompt = [
    `我的处境：${situation}`,
    `对方在知乎发布的内容标题：${candidate.title}`,
    `对方昵称：${candidate.authorName}`,
    `内容摘要：${candidate.contentText.replace(/<\/?em>/g, '')}`,
    `原文链接：${candidate.url}`,
  ].join('\n');

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[icebreaker] prompt', { system: SYSTEM_PROMPT, user: userPrompt });
  }

  try {
    const message = await askZhida(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      'zhida-fast-1p5',
    );

    cacheSet(cacheKey, message, TTL.ICEBREAKER);
    return NextResponse.json({ message } satisfies IcebreakerResponse);
  } catch (error) {
    if (error instanceof ZhihuQuotaError) {
      return NextResponse.json(
        { error: '知乎直答今日额度已用完，请稍后再试' },
        { status: 429 },
      );
    }
    console.error('icebreaker route failed', error);
    return NextResponse.json({ error: '生成暂时不可用，请稍后再试' }, { status: 502 });
  }
}
