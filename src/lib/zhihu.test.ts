import { afterEach, describe, expect, it, vi } from 'vitest';
import { askZhida, searchZhihu, ZhihuQuotaError } from './zhihu';

const originalFetch = global.fetch;
const originalSecret = process.env.ZHIHU_ACCESS_SECRET;

afterEach(() => {
  global.fetch = originalFetch;
  process.env.ZHIHU_ACCESS_SECRET = originalSecret;
  vi.restoreAllMocks();
});

describe('searchZhihu', () => {
  it('constructs auth headers and caps Count at 10', async () => {
    process.env.ZHIHU_ACCESS_SECRET = 'test-secret';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ Code: 0, Message: 'success', Data: { HasMore: false, Items: [] } }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await searchZhihu('test query', 50);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('Count=10');
    const headers = options.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-secret');
    expect(Number(headers['X-Request-Timestamp'])).toBeGreaterThan(0);
  });

  it('throws ZhihuQuotaError on quota codes', async () => {
    process.env.ZHIHU_ACCESS_SECRET = 'test-secret';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ Code: 30002, Message: 'quota exceeded', Data: {} }),
    }) as unknown as typeof fetch;

    await expect(searchZhihu('q')).rejects.toBeInstanceOf(ZhihuQuotaError);
  });
});

describe('askZhida', () => {
  it('sends model/messages/stream body and returns content', async () => {
    process.env.ZHIHU_ACCESS_SECRET = 'test-secret';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: 'hello' } }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await askZhida([{ role: 'user', content: 'hi' }]);
    expect(result).toBe('hello');

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({
      model: 'zhida-fast-1p5',
      messages: [{ role: 'user', content: 'hi' }],
      stream: false,
    });
  });
});
