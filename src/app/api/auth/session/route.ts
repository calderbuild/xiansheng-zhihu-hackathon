import { NextRequest, NextResponse } from 'next/server';
import { clearSession, readSession } from '@/lib/auth';
import type { SessionStatus } from '@/lib/types';

export function GET(request: NextRequest) {
  const session = readSession(request);
  if (!session) {
    const response = NextResponse.json({ connected: false } satisfies SessionStatus);
    clearSession(response);
    return response;
  }

  return NextResponse.json({
    connected: true,
    expiresAt: session.expiresAt,
    user: { uid: session.user.uid, name: session.user.fullname, avatarUrl: session.user.avatarPath },
  } satisfies SessionStatus);
}
