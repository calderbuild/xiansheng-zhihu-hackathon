import { describe, expect, it } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { writeSession, type ZhihuSession } from '@/lib/auth';
import { GET } from './route';

describe('GET /api/auth/session', () => {
  it('returns connected:false with no session cookie', async () => {
    const response = GET(new NextRequest('http://localhost/api/auth/session'));
    const data = await response.json();
    expect(data).toEqual({ connected: false });
  });

  it('returns the session user when a valid session cookie is present', async () => {
    const session: ZhihuSession = {
      accessToken: 'tok',
      expiresAt: Date.now() + 60_000,
      user: { uid: '42', fullname: '测试', headline: '', avatarPath: 'https://x/a.jpg' },
    };
    const cookieResponse = NextResponse.json({});
    writeSession(cookieResponse, session);
    const cookie = cookieResponse.cookies
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = GET(new NextRequest('http://localhost/api/auth/session', { headers: { cookie } }));
    const data = await response.json();
    expect(data).toEqual({
      connected: true,
      expiresAt: session.expiresAt,
      user: { uid: '42', name: '测试', avatarUrl: 'https://x/a.jpg' },
    });
  });
});
