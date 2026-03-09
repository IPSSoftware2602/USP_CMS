/**
 * Flag to prevent multiple 'auth:expired' events from firing
 * when several API calls fail with 401 at once.
 */
let _authExpiredFired = false;

/** Reset the flag (called by AuthInterceptor after handling logout) */
export function resetAuthExpiredFlag() {
  _authExpiredFired = false;
}

/** URLs that should NOT trigger session-expired (e.g. login, registration) */
const AUTH_ENDPOINTS = ['login', 'users'];

function isAuthUrl(url) {
  if (!url) return false;
  
  // Extract the string URL
  let urlStr = typeof url === 'string' ? url : url.url || '';
  
  // Strip query strings/hashes for comparison
  const cleanUrl = urlStr.split('?')[0].split('#')[0];
  
  // Check if any of the auth endpoints match exactly or at the end of the path
  return AUTH_ENDPOINTS.some(endpoint => {
    return cleanUrl === endpoint || cleanUrl.endsWith('/' + endpoint);
  });
}

function fireAuthExpired() {
  if (_authExpiredFired) return;
  _authExpiredFired = true;
  window.dispatchEvent(new CustomEvent('auth:expired'));
}

/**
 * Per-service helper — call inside handleResponse.
 */
export function checkAuthExpired(response, url) {
  if (response.status === 401 && !isAuthUrl(url)) {
    fireAuthExpired();
  }
}

/**
 * Global fetch interceptor — patches window.fetch to automatically
 * fire 'auth:expired' on ANY 401 response, covering all services.
 * Skips login/register URLs and only fires once.
 */
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);
  const url = args[0];
  if (response.status === 401 && !isAuthUrl(url)) {
    fireAuthExpired();
  }
  return response;
};

