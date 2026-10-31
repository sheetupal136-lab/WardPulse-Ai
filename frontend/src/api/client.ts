/**
 * WardPulse AI API Client
 * Compatible with local Vite development (proxies /api to localhost:8000)
 * and production Vercel deployment (explicit VITE_API_BASE_URL pointing to Render).
 */

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const getApiBaseUrl = (): string => {
  if (rawBaseUrl && typeof rawBaseUrl === 'string' && rawBaseUrl.trim().length > 0) {
    // Strip trailing slashes to avoid '//' issues
    return rawBaseUrl.trim().replace(/\/+$/, '');
  }

  // Detect unconfigured production Vercel deployment
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      console.warn(
        '[WardPulse AI] Warning: VITE_API_BASE_URL is not configured in production environment. ' +
        'API calls are falling back to relative "/api", which will trigger Vercel FUNCTION_INVOCATION_FAILED (500). ' +
        'Set VITE_API_BASE_URL=https://<your-render-backend>.onrender.com/api in Vercel Project Settings.'
      );
    }
  }

  // Default to relative '/api' for local Vite dev proxy
  return '/api';
};

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkErr: unknown) {
    const errMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    throw new Error(
      `Network Error: Failed to reach backend API at "${url}". Details: ${errMsg}. ` +
      `Ensure the FastAPI backend is running on Render and CORS is configured for this domain.`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    let parsedDetail = '';
    try {
      const jsonErr = JSON.parse(errorText);
      parsedDetail = jsonErr.detail || jsonErr.message || '';
    } catch {
      // Raw string response
    }

    // Specific diagnosis for Vercel serverless function crash
    if (response.status === 500 && errorText.includes('FUNCTION_INVOCATION_FAILED')) {
      throw new Error(
        `Vercel Serverless Function error (FUNCTION_INVOCATION_FAILED): ` +
        `The frontend called relative "/api" on Vercel because VITE_API_BASE_URL is not set in Vercel settings. ` +
        `Please add VITE_API_BASE_URL=https://YOUR-FASTAPI-BACKEND.onrender.com/api in Vercel Project Settings > Environment Variables, then redeploy.`
      );
    }

    const detailMsg = parsedDetail || errorText || response.statusText;
    throw new Error(`API error (${response.status}): ${detailMsg}`);
  }

  return response.json() as Promise<T>;
}
