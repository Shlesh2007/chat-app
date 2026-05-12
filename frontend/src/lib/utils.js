const BACKEND = import.meta.env.VITE_BACKEND_URL || '';

// Resolve backend asset URLs (avatars, uploads)
export function assetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BACKEND}${path}`;
}

// Get backend base URL for fetch() calls (streaming)
export function backendUrl(path) {
  if (import.meta.env.VITE_BACKEND_URL) {
    return `${import.meta.env.VITE_BACKEND_URL}${path}`;
  }
  return path; // dev: Vite proxy handles it
}
