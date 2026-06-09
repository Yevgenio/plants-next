const isProd = process.env.NODE_ENV === 'production';
const isServer = typeof window === 'undefined';

let API_URL: string;

if (isProd) {
  // Server-side: prefer internal URL (k8s cluster DNS), fall back to public URL.
  // Client-side: must use NEXT_PUBLIC_API_URL (baked in at build time) — relative
  // paths only work when a proxy (Traefik/nginx) routes /api/... to the backend.
  API_URL = isServer
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '')
    : (process.env.NEXT_PUBLIC_API_URL ?? '');
} else {
  API_URL = 'http://localhost:5001';
}

export default API_URL;

// Always empty in production so <img src> renders as a relative path the browser
// can reach via the reverse proxy — even when rendered in a server component.
export const IMAGE_URL = isProd
  ? (process.env.NEXT_PUBLIC_IMAGE_URL ?? '')
  : 'http://10.0.0.105:9000/gallery';

// Resolves any image path to a full URL.
// Handles blob: URLs (new local uploads), absolute http URLs, and relative MinIO keys.
export const resolveImageUrl = (path: string): string => {
  if (!path) return `${IMAGE_URL}/default.jpg`;
  if (path.startsWith('blob:') || path.startsWith('http') || path.startsWith('/')) return path;
  return `${IMAGE_URL}/${path}`;
};