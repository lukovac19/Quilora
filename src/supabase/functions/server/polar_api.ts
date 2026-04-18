export function polarServerBaseUrl(): string {
  const override = Deno.env.get('POLAR_API_BASE')?.trim();
  if (override) return override.replace(/\/$/, '');
  const env = (Deno.env.get('POLAR_ENV') ?? 'production').toLowerCase();
  if (env === 'sandbox') return 'https://sandbox-api.polar.sh';
  return 'https://api.polar.sh';
}

export async function polarApiJson<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = Deno.env.get('POLAR_ACCESS_TOKEN')?.trim();
  if (!token) throw new Error('POLAR_ACCESS_TOKEN is not configured');
  const url = `${polarServerBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('polar_api_error', res.status, text.slice(0, 800));
    throw new Error(`Polar API ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}
