const AUTHORIZE_URL = 'https://openapi.zhihu.com/authorize';
const ACCESS_TOKEN_URL = 'https://openapi.zhihu.com/access_token';
const USER_URL = 'https://openapi.zhihu.com/user';

export interface ZhihuOAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ZhihuOAuthUser {
  uid: string;
  fullname: string;
  headline: string;
  avatarPath: string;
}

export function hasZhihuOAuthConfig() {
  return Boolean(process.env.ZHIHU_OAUTH_APP_ID && process.env.ZHIHU_OAUTH_APP_KEY);
}

export function getZhihuOAuthRedirectUri() {
  return (
    process.env.ZHIHU_OAUTH_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`
  );
}

export function buildZhihuAuthorizationUrl(state: string) {
  const params = new URLSearchParams({
    redirect_uri: getZhihuOAuthRedirectUri(),
    app_id: process.env.ZHIHU_OAUTH_APP_ID ?? '',
    response_type: 'code',
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

// ponytail: uid is an int64 that can exceed Number.MAX_SAFE_INTEGER (verified in
// .claude/skills/zhihu/references/hackathon-user-profile-api.md) — quote the raw
// digits before JSON.parse touches them, or precision silently gets lost.
function parseUserResponse(rawText: string): Record<string, unknown> {
  const quoted = rawText.replace(/"uid"\s*:\s*(\d+)/, '"uid":"$1"');
  return JSON.parse(quoted);
}

export async function exchangeZhihuCode(code: string): Promise<ZhihuOAuthToken> {
  const body = new URLSearchParams({
    app_id: process.env.ZHIHU_OAUTH_APP_ID ?? '',
    app_key: process.env.ZHIHU_OAUTH_APP_KEY ?? '',
    grant_type: 'authorization_code',
    redirect_uri: getZhihuOAuthRedirectUri(),
    code,
  });

  const response = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const payload = (await response.json().catch(() => null)) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
  } | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(`zhihu access_token exchange failed with status ${response.status}`);
  }

  return {
    accessToken: payload.access_token,
    tokenType: payload.token_type ?? 'Bearer',
    expiresIn: payload.expires_in ?? 3600,
  };
}

export async function getZhihuUserInfo(accessToken: string): Promise<ZhihuOAuthUser> {
  const response = await fetch(USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const rawText = await response.text();
  const payload = parseUserResponse(rawText) as {
    uid?: string;
    fullname?: string;
    headline?: string;
    avatar_path?: string;
  };

  if (!response.ok || !payload.uid) {
    throw new Error(`zhihu /user request failed with status ${response.status}`);
  }

  return {
    uid: payload.uid,
    fullname: payload.fullname ?? '',
    headline: payload.headline ?? '',
    avatarPath: payload.avatar_path ?? '',
  };
}
