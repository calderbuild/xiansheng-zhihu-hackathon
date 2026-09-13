import type { ZhihuSearchItem } from './types';

const SEARCH_URL = 'https://developer.zhihu.com/api/v1/content/zhihu_search';
const ZHIDA_URL = 'https://developer.zhihu.com/v1/chat/completions';

interface ZhihuEnvelope<T> {
  Code: number;
  Message: string;
  Data: T;
}

function getAccessSecret() {
  const secret = process.env.ZHIHU_ACCESS_SECRET;
  if (!secret) {
    throw new Error('ZHIHU_ACCESS_SECRET is not configured.');
  }
  return secret;
}

function authHeaders(extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${getAccessSecret()}`,
    'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
    ...extra,
  };
}

export class ZhihuQuotaError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ZhihuQuotaError';
  }
}

async function requestWithRetry(fn: () => Promise<Response>, retries = 1): Promise<Response> {
  const response = await fn();
  if (response.status === 429 && retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return requestWithRetry(fn, retries - 1);
  }
  return response;
}

export async function searchZhihu(query: string, count = 10) {
  const params = new URLSearchParams({
    Query: query,
    Count: String(Math.min(Math.max(count, 1), 10)),
  });

  const response = await requestWithRetry(() =>
    fetch(`${SEARCH_URL}?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
    }),
  );

  const payload = (await response.json().catch(() => null)) as ZhihuEnvelope<{
    HasMore: boolean;
    SearchHashId: string;
    Items: ZhihuSearchItem[];
    EmptyReason?: string;
  }> | null;

  if (!response.ok || !payload) {
    throw new Error(`zhihu_search request failed with status ${response.status}`);
  }

  if (payload.Code === 30001 || payload.Code === 30002) {
    throw new ZhihuQuotaError(payload.Code, payload.Message);
  }

  if (payload.Code !== 0) {
    throw new Error(`zhihu_search error ${payload.Code}: ${payload.Message}`);
  }

  return {
    items: payload.Data.Items ?? [],
    emptyReason: payload.Data.EmptyReason,
  };
}

export async function askZhida(
  messages: { role: string; content: string }[],
  model: 'zhida-fast-1p5' | 'zhida-thinking-1p5' | 'zhida-agent' = 'zhida-fast-1p5',
) {
  const response = await requestWithRetry(() =>
    fetch(ZHIDA_URL, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ model, messages, stream: false }),
    }),
  );

  const payload = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
    error?: { message: string; code: string };
    Code?: number;
    Message?: string;
  } | null;

  if (!response.ok || !payload) {
    throw new Error(`zhida request failed with status ${response.status}`);
  }

  if (payload.error) {
    throw new Error(`zhida error ${payload.error.code}: ${payload.error.message}`);
  }

  if (payload.Code === 30001 || payload.Code === 30002) {
    throw new ZhihuQuotaError(payload.Code, payload.Message ?? 'quota exceeded');
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('zhida returned no content.');
  }

  return content;
}
