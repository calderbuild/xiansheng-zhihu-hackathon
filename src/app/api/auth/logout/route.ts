import { NextRequest, NextResponse } from 'next/server';
import { clearOAuthState, clearSession } from '@/lib/auth';

export function GET(request: NextRequest) {
  const home = new URL('/', request.url);
  home.searchParams.set('auth', 'disconnected');
  const response = NextResponse.redirect(home);
  clearOAuthState(response);
  clearSession(response);
  return response;
}
