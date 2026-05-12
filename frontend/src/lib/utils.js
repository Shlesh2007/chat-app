// Resolve a backend asset URL (uploads, avatars, etc.)
// In dev, Vite proxies /api but not /uploads, so we need the full backend URL.
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function assetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path; // already absolute
  return `${BACKEND}${path}`;
}
