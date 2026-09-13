import { NextRequest, NextResponse } from 'next/server';
import { clearOAuthState, clearSession, createSessionFromCode, readOAuthState, writeSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const home = new URL('/', request.url);
  // hackathon-oauth.md: callback param is `authorization_code`; accept `code` too
  // in case of a protocol revision (oauth.md notes this as the compatibility fallback).
  const code = request.nextUrl.searchParams.get('authorization_code') ?? request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');
  const storedState = readOAuthState(request);

  if (error) {
    home.searchParams.set('auth', 'denied');
    const response = NextResponse.redirect(home);
    clearOAuthState(response);
    return response;
  }

  if (!code || !state || !storedState || state !== storedState) {
    home.searchParams.set('auth', 'failed-state');
    const response = NextResponse.redirect(home);
    clearOAuthState(response);
    clearSession(response);
    return response;
  }

  try {
    const session = await createSessionFromCode(code);
    home.searchParams.set('auth', 'connected');
    const response = NextResponse.redirect(home);
    clearOAuthState(response);
    writeSession(response, session);
    return response;
  } catch (err) {
    console.error('zhihu oauth callback exchange failed', err);
    home.searchParams.set('auth', 'failed-exchange');
    const response = NextResponse.redirect(home);
    clearOAuthState(response);
    clearSession(response);
    return response;
  }
}
