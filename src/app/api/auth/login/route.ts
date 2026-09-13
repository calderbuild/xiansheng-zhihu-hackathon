import { NextResponse } from 'next/server';
import { createOAuthState, hasOAuthConfig, writeOAuthState } from '@/lib/auth';
import { buildZhihuAuthorizationUrl, getAppOrigin } from '@/lib/zhihu-oauth';

export function GET() {
  const home = new URL('/', getAppOrigin());

  if (!hasOAuthConfig()) {
    home.searchParams.set('auth', 'misconfigured');
    return NextResponse.redirect(home);
  }

  const state = createOAuthState();
  const response = NextResponse.redirect(buildZhihuAuthorizationUrl(state));
  writeOAuthState(response, state);
  return response;
}
