import { NextRequest, NextResponse } from 'next/server';
import { createOAuthState, hasOAuthConfig, writeOAuthState } from '@/lib/auth';
import { buildZhihuAuthorizationUrl } from '@/lib/zhihu-oauth';

export function GET(request: NextRequest) {
  const home = new URL('/', request.url);

  if (!hasOAuthConfig()) {
    home.searchParams.set('auth', 'misconfigured');
    return NextResponse.redirect(home);
  }

  const state = createOAuthState();
  const response = NextResponse.redirect(buildZhihuAuthorizationUrl(state));
  writeOAuthState(response, state);
  return response;
}
