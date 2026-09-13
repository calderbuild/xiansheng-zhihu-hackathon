import type { NextRequest, NextResponse } from 'next/server';
import {
  exchangeZhihuCode,
  getZhihuUserInfo,
  hasZhihuOAuthConfig,
  type ZhihuOAuthUser,
} from './zhihu-oauth';

const SESSION_COOKIE = 'xiansheng_zhihu_session';
const STATE_COOKIE = 'xiansheng_oauth_state';

export interface ZhihuSession {
  accessToken: string;
  expiresAt: number;
  user: ZhihuOAuthUser;
}

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === 'production';
}

function serializeSession(session: ZhihuSession) {
  return encodeURIComponent(JSON.stringify(session));
}

function deserializeSession(value?: string): ZhihuSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<ZhihuSession>;
    if (typeof parsed.accessToken !== 'string' || typeof parsed.expiresAt !== 'number' || !parsed.user) {
      return null;
    }
    return { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt, user: parsed.user };
  } catch {
    return null;
  }
}

export function hasOAuthConfig() {
  return hasZhihuOAuthConfig();
}

export function createOAuthState() {
  return crypto.randomUUID().replace(/-/g, '');
}

export function readSession(request: NextRequest): ZhihuSession | null {
  const session = deserializeSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session || session.expiresAt <= Date.now()) return null;
  return session;
}

export function readOAuthState(request: NextRequest) {
  return request.cookies.get(STATE_COOKIE)?.value;
}

export function writeSession(response: NextResponse, session: ZhihuSession) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: serializeSession(session),
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookies(),
    path: '/',
    expires: new Date(session.expiresAt),
  });
}

export function writeOAuthState(response: NextResponse, state: string) {
  response.cookies.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookies(),
    path: '/',
    maxAge: 60 * 10,
  });
}

export function clearSession(response: NextResponse) {
  response.cookies.set({ name: SESSION_COOKIE, value: '', path: '/', maxAge: 0 });
}

export function clearOAuthState(response: NextResponse) {
  response.cookies.set({ name: STATE_COOKIE, value: '', path: '/', maxAge: 0 });
}

// ponytail: Zhihu's OAuth has no refresh_token (verified in reference docs) — a session
// just expires after expiresIn seconds and the user has to log in again, no auto-refresh.
export async function createSessionFromCode(code: string): Promise<ZhihuSession> {
  const token = await exchangeZhihuCode(code);
  const user = await getZhihuUserInfo(token.accessToken);
  return {
    accessToken: token.accessToken,
    expiresAt: Date.now() + token.expiresIn * 1000,
    user,
  };
}
