import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('GET /api/auth/logout', () => {
  it('redirects home with auth=disconnected and clears the session cookie', () => {
    const response = GET(new NextRequest('http://localhost/api/auth/logout'));
    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/');
    expect(location.searchParams.get('auth')).toBe('disconnected');
    expect(response.cookies.get('xiansheng_zhihu_session')?.value).toBe('');
  });
});
