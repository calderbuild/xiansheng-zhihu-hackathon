export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data?.error ?? '请求失败，请稍后再试' };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: '网络似乎断开了，请检查网络后重试' };
  }
}
