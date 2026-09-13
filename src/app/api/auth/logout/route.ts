import { NextResponse } from 'next/server';
import { clearOAuthState, clearSession } from '@/lib/auth';
import { getAppOrigin } from '@/lib/zhihu-oauth';

export function GET() {
  const home = new URL('/', getAppOrigin());
  home.searchParams.set('auth', 'disconnected');
  const response = NextResponse.redirect(home);
  clearOAuthState(response);
  clearSession(response);
  return response;
}
