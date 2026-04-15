/** Decode and validate an in-app path (open redirect safe). */
export function safeInternalPath(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  try {
    const path = decodeURIComponent(raw.trim());
    if (path.startsWith('/') && !path.startsWith('//')) return path;
  } catch {
    /* ignore malformed redirect */
  }
  return null;
}
