/**
 * Route & Navigation Utilities for ATLAS.PAY
 *
 * Provides pure, deterministic helpers for:
 * - URL path normalization (trailing slashes, duplicate slashes, queries, hashes)
 * - Mapping between URL paths and internal activePage keys
 * - Identifying protected vs public pages
 * - Resolving authentication access control redirects
 * - Sanitizing error diagnostic stacks (redacting tokens/credentials)
 */

export const PROTECTED_PAGES = [
  'dashboard',
  'checkout',
  'cards',
  'rupay-upi',
  'transactions',
  'student-payments',
  'guardian',
  'settings'
];

export const PUBLIC_PAGES = [
  'landing',
  'login',
  'signup',
  'forgot-password',
  'auth-callback',
  'not-found'
];

/**
 * Safely normalize a URL pathname:
 * - Strips query strings (?key=val) and hashes (#anchor)
 * - Collapses consecutive slashes (/// -> /)
 * - Trims whitespace and trailing slashes (except root '/')
 * - Normalizes to lowercase for path comparison
 *
 * @param {string} rawPath
 * @returns {string}
 */
export function normalizePath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') {
    return '/';
  }

  // Strip query string and fragment/hash
  const pathOnly = rawPath.split('?')[0].split('#')[0].trim();
  if (!pathOnly) {
    return '/';
  }

  // Collapse multiple slashes
  const collapsed = pathOnly.replace(/\/+/g, '/');

  // Remove trailing slash if length > 1
  if (collapsed.length > 1 && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1);
  }

  return collapsed || '/';
}

/**
 * Resolve an internal activePage key from any URL path.
 * Unknown or unmapped routes return 'not-found' rather than silently
 * rendering an invalid empty page.
 *
 * @param {string} path - URL pathname
 * @returns {string} activePage key
 */
export function getPageFromPath(path) {
  const normalized = normalizePath(path).toLowerCase();

  switch (normalized) {
    case '/':
    case '/landing':
      return 'landing';

    case '/login':
      return 'login';

    case '/signup':
    case '/register':
      return 'signup';

    case '/forgot-password':
      return 'forgot-password';

    case '/auth/callback':
    case '/auth-callback':
      return 'auth-callback';

    case '/dashboard':
      return 'dashboard';

    case '/checkout':
      return 'checkout';

    case '/cards':
    case '/my-cards':
      return 'cards';

    case '/rupay-upi':
    case '/compatibility':
      return 'rupay-upi';

    case '/transactions':
    case '/history':
      return 'transactions';

    case '/student-payments':
    case '/student':
      return 'student-payments';

    case '/guardian':
    case '/parent-approval':
    case '/parent':
      return 'guardian';

    case '/settings':
      return 'settings';

    default:
      return 'not-found';
  }
}

/**
 * Resolve the canonical URL path for a given activePage key.
 *
 * @param {string} page - activePage key
 * @returns {string} Canonical URL path
 */
export function getPathFromPage(page) {
  switch (page) {
    case 'landing':
      return '/';
    case 'login':
      return '/login';
    case 'signup':
    case 'register':
      return '/signup';
    case 'forgot-password':
      return '/forgot-password';
    case 'auth-callback':
      return '/auth/callback';
    case 'dashboard':
      return '/dashboard';
    case 'checkout':
      return '/checkout';
    case 'cards':
      return '/cards';
    case 'rupay-upi':
      return '/rupay-upi';
    case 'transactions':
      return '/transactions';
    case 'student-payments':
    case 'student':
      return '/student-payments';
    case 'guardian':
    case 'parent-approval':
      return '/guardian';
    case 'settings':
      return '/settings';
    case 'not-found':
      return '/not-found';
    default:
      return '/';
  }
}

/**
 * Determine if a page key is protected by authentication.
 *
 * @param {string} page
 * @returns {boolean}
 */
export function isProtectedPage(page) {
  return PROTECTED_PAGES.includes(page);
}

/**
 * Determine if a page key belongs to the public view layout.
 *
 * @param {string} page
 * @returns {boolean}
 */
export function isPublicPage(page) {
  return PUBLIC_PAGES.includes(page);
}

/**
 * Calculate access control redirects safely without infinite loops.
 *
 * @param {Object} params
 * @param {boolean} params.isAuthenticated
 * @param {string} params.activePage
 * @param {string|null} params.savedRedirect
 * @returns {{ redirect: string|null, saveRedirect: string|null }}
 */
export function resolveAuthRedirect({ isAuthenticated, activePage, savedRedirect }) {
  // Case 1: Unauthenticated user trying to access a protected workspace route
  if (!isAuthenticated && isProtectedPage(activePage)) {
    const intendedPath = getPathFromPage(activePage);
    return {
      redirect: 'login',
      saveRedirect: intendedPath
    };
  }

  // Case 2: Authenticated user attempting to visit login/signup pages
  if (isAuthenticated && (activePage === 'login' || activePage === 'signup')) {
    const target = savedRedirect && savedRedirect !== '/login' && savedRedirect !== '/signup'
      ? getPageFromPath(savedRedirect)
      : 'dashboard';

    return {
      redirect: target === 'not-found' ? 'dashboard' : target,
      saveRedirect: null
    };
  }

  return { redirect: null, saveRedirect: null };
}

/**
 * Sanitize error message and stack trace to prevent leaking credentials or tokens.
 *
 * @param {Error|Object|string} error
 * @param {Object} [errorInfo]
 * @returns {{ message: string, componentStack: string }}
 */
export function sanitizeErrorDetails(error, errorInfo = null) {
  let rawMsg = '';
  if (typeof error === 'string') {
    rawMsg = error;
  } else if (error && error.message) {
    rawMsg = error.message;
  } else {
    rawMsg = 'An unexpected application error occurred.';
  }

  // Mask Bearer tokens, secrets, JWTs, credentials
  const sanitizedMsg = rawMsg
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED]')
    .replace(/(password|token|secret)=([^\s&]+)/gi, '$1=[REDACTED]');

  let stack = '';
  if (errorInfo?.componentStack) {
    stack = errorInfo.componentStack;
  } else if (error?.stack) {
    stack = error.stack;
  }

  const sanitizedStack = stack
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED]')
    .replace(/(password|token|secret)=([^\s&]+)/gi, '$1=[REDACTED]');

  return {
    message: sanitizedMsg,
    componentStack: sanitizedStack
  };
}
