import { afterEach, describe, expect, it, vi } from 'vitest';
import { exchangeZhihuCode, getZhihuUserInfo } from './zhihu-oauth';

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe('getZhihuUserInfo', () => {
  it('preserves uid precision beyond Number.MAX_SAFE_INTEGER', async () => {
    // a uid whose last 3 digits would be mangled by normal JSON.parse float rounding
    const rawUid = '969570047710216200123';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        `{"uid":${rawUid},"hash_id":"abc","fullname":"测试用户","headline":"h","avatar_path":"https://example.com/a.jpg"}`,
    }) as unknown as typeof fetch;

    const user = await getZhihuUserInfo('token');
    expect(user.uid).toBe(rawUid);
    expect(user.fullname).toBe('测试用户');
  });

  it('throws when the response has no uid', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `{"code":404,"data":"User don't exist"}`,
    }) as unknown as typeof fetch;

    await expect(getZhihuUserInfo('token')).rejects.toThrow();
  });
});

describe('exchangeZhihuCode', () => {
  it('posts app_id/app_key/grant_type/redirect_uri/code as form fields', async () => {
    process.env.ZHIHU_OAUTH_APP_ID = 'app-id';
    process.env.ZHIHU_OAUTH_APP_KEY = 'app-key';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'tok', token_type: 'Bearer', expires_in: 3600 }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const token = await exchangeZhihuCode('auth-code');

    expect(token).toEqual({ accessToken: 'tok', tokenType: 'Bearer', expiresIn: 3600 });
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://openapi.zhihu.com/access_token');
    const body = new URLSearchParams(options.body as string);
    expect(body.get('app_id')).toBe('app-id');
    expect(body.get('app_key')).toBe('app-key');
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('auth-code');
  });
});
