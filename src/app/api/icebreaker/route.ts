import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { askZhida, ZhihuQuotaError } from '@/lib/zhihu';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';
import type { IcebreakerRequest, IcebreakerResponse } from '@/lib/types';

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

  // ponytail: zhida-fast-1p5 reliably ignores a system-role instruction here and
  // writes a Zhihu-style advice essay instead of a DM opener, even with an explicit
  // "no markdown, 3-5 sentences" system prompt — verified against the live API with
  // both short and full-length real content. Putting the instructions plus a one-shot
  // format example inside the single user turn (no system message) fixed it in every
  // trial; upgrade path is to re-test if the model gets swapped.
  const userPrompt = `请扮演"我"，给知乎作者"${candidate.authorName}"写一条知乎私信，这是我们的第一次接触。

背景，我的处境：${situation}
她/他发布的真实内容标题：${candidate.title}
她/他发布的真实内容：${candidate.contentText.replace(/<\/?em>/g, '')}
原文链接：${candidate.url}

私信格式范例（仅供参考格式，内容你要换成基于上面真实信息的原创）：
"你好！看到你写的谢丽媛裸辞创业那篇，我最近也在纠结要不要裸辞去创业，看到她"纠结了很久才下定决心"这句特别有共鸣。想问问你，你观察下来，像她这样最后真下决心裸辞的人，是有什么共同点让他们跨出那一步的吗？"

现在请你直接输出私信正文（纯文本，不要标题不要列表不要任何 markdown 符号，3-5 句话，以一个具体问题结尾，不许编造上面真实内容之外的细节，不要说"这是AI生成的"）：`;

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[icebreaker] prompt', { user: userPrompt });
  }

  try {
    const message = await askZhida([{ role: 'user', content: userPrompt }], 'zhida-fast-1p5');

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
