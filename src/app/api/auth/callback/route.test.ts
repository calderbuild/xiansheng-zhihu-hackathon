import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return { ...actual, createSessionFromCode: vi.fn() };
});

import { createSessionFromCode, writeOAuthState } from '@/lib/auth';
import { GET } from './route';

function makeRequest(url: string, stateCookie?: string) {
  const headers: Record<string, string> = {};
  if (stateCookie) {
    const cookieResponse = NextResponse.json({});
    writeOAuthState(cookieResponse, stateCookie);
    headers.cookie = cookieResponse.cookies
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
  }
  return new NextRequest(url, { headers });
}

beforeEach(() => {
  vi.mocked(createSessionFromCode).mockReset();
});

describe('GET /api/auth/callback', () => {
  it('redirects with failed-state when state does not match', async () => {
    const request = makeRequest(
      'http://localhost/api/auth/callback?authorization_code=abc&state=wrong',
      'expected-state',
    );
    const response = await GET(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.searchParams.get('auth')).toBe('failed-state');
    expect(createSessionFromCode).not.toHaveBeenCalled();
  });

  it('redirects with failed-state when no state cookie was stored at all', async () => {
    const request = makeRequest('http://localhost/api/auth/callback?authorization_code=abc&state=abc');
    const response = await GET(request);
    const location = new URL(response.headers.get('location')!);
    expect(location.searchParams.get('auth')).toBe('failed-state');
  });

  it('exchanges the code and sets a session when state matches', async () => {
    vi.mocked(createSessionFromCode).mockResolvedValue({
      accessToken: 'tok',
      expiresAt: Date.now() + 3_600_000,
      user: { uid: '1', fullname: 'n', headline: '', avatarPath: '' },
    });

    const request = makeRequest(
      'http://localhost/api/auth/callback?authorization_code=abc&state=match',
      'match',
    );
    const response = await GET(request);
    const location = new URL(response.headers.get('location')!);
    expect(location.searchParams.get('auth')).toBe('connected');
    expect(createSessionFromCode).toHaveBeenCalledWith('abc');
  });

  it('redirects with failed-exchange when the code exchange throws', async () => {
    vi.mocked(createSessionFromCode).mockRejectedValue(new Error('exchange failed'));

    const request = makeRequest(
      'http://localhost/api/auth/callback?authorization_code=abc&state=match',
      'match',
    );
    const response = await GET(request);
    const location = new URL(response.headers.get('location')!);
    expect(location.searchParams.get('auth')).toBe('failed-exchange');
  });

  it('redirects with denied when Zhihu returns an error param', async () => {
    const request = makeRequest('http://localhost/api/auth/callback?error=access_denied');
    const response = await GET(request);
    const location = new URL(response.headers.get('location')!);
    expect(location.searchParams.get('auth')).toBe('denied');
  });
});
