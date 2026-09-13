const FALLBACK_MODEL = 'gpt-4o-mini';

// ponytail: api.openai-next.com blocks Node's default fetch UA via Cloudflare (403,
// error 1010) — verified with a live probe. A browser-shaped UA is required, not optional.
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

export async function askOpenAiNextFallback(messages: { role: string; content: string }[]) {
  const baseUrl = process.env.OPENAI_NEXT_BASE_URL;
  const apiKey = process.env.OPENAI_NEXT_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error('OPENAI_NEXT_BASE_URL/OPENAI_NEXT_API_KEY are not configured.');
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': BROWSER_USER_AGENT,
    },
    body: JSON.stringify({ model: FALLBACK_MODEL, messages }),
  });

  const payload = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
  } | null;
  const content = payload?.choices?.[0]?.message?.content;

  if (!response.ok || !content) {
    throw new Error(`openai-next fallback failed with status ${response.status}`);
  }

  return content;
}
