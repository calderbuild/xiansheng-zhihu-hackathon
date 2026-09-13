import { describe, expect, it, afterEach } from 'vitest';
import { GET } from './route';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('GET /api/auth/login', () => {
  it('redirects to misconfigured when OAuth env vars are missing', async () => {
    delete process.env.ZHIHU_OAUTH_APP_ID;
    delete process.env.ZHIHU_OAUTH_APP_KEY;
    const response = GET();
    const location = new URL(response.headers.get('location')!);
    expect(location.searchParams.get('auth')).toBe('misconfigured');
  });

  it('redirects to the Zhihu authorization URL and sets a state cookie when configured', async () => {
    process.env.ZHIHU_OAUTH_APP_ID = 'app-id';
    process.env.ZHIHU_OAUTH_APP_KEY = 'app-key';
    const response = GET();
    const location = new URL(response.headers.get('location')!);
    expect(location.origin + location.pathname).toBe('https://openapi.zhihu.com/authorize');
    expect(location.searchParams.get('app_id')).toBe('app-id');
    expect(location.searchParams.get('state')).toBeTruthy();
    expect(response.cookies.get('xiansheng_oauth_state')?.value).toBe(location.searchParams.get('state'));
  });
});
