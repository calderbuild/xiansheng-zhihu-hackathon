import { describe, expect, it } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { clearSession, readOAuthState, readSession, writeOAuthState, writeSession, type ZhihuSession } from './auth';

function requestWithCookies(response: NextResponse) {
  const cookieHeader = response.cookies
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  return new NextRequest('http://localhost/', { headers: { cookie: cookieHeader } });
}

describe('session cookie round-trip', () => {
  it('writes and reads back a valid session', () => {
    const session: ZhihuSession = {
      accessToken: 'tok',
      expiresAt: Date.now() + 60_000,
      user: { uid: '123', fullname: 'name', headline: '', avatarPath: '' },
    };
    const response = NextResponse.json({ ok: true });
    writeSession(response, session);

    const read = readSession(requestWithCookies(response));
    expect(read).toEqual(session);
  });

  it('treats an expired session as absent', () => {
    const session: ZhihuSession = {
      accessToken: 'tok',
      expiresAt: Date.now() - 1,
      user: { uid: '123', fullname: 'name', headline: '', avatarPath: '' },
    };
    const response = NextResponse.json({ ok: true });
    writeSession(response, session);

    expect(readSession(requestWithCookies(response))).toBeNull();
  });

  it('clearing the session leaves nothing readable', () => {
    const response = NextResponse.json({ ok: true });
    clearSession(response);
    expect(readSession(requestWithCookies(response))).toBeNull();
  });
});

describe('oauth state cookie', () => {
  it('writes and reads back the state value', () => {
    const response = NextResponse.json({ ok: true });
    writeOAuthState(response, 'random-state-value');
    expect(readOAuthState(requestWithCookies(response))).toBe('random-state-value');
  });
});
