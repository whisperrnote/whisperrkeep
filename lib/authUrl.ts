/**
 * Generate the auth/accounts IDM subdomain URL
 * Handles both http and https protocols
 */
export function getAuthURL(): string {
  const authSubdomain = process.env.AUTH_SUBDOMAIN || "accounts";
  const appSubdomain = process.env.APP_SUBDOMAIN || "whisperrnote.space";

  if (!appSubdomain) {
    throw new Error(
      "APP_SUBDOMAIN environment variable is required for auth URL generation",
    );
  }

  // Use http/https based on current protocol or default to https
  const protocol =
    typeof window !== "undefined" ? window.location.protocol : "https:";

  return `${protocol}//${authSubdomain}.${appSubdomain}`;
}

/**
 * Get the origin of the auth server for postMessage validation
 */
export function getAuthOrigin(): string {
  return getAuthURL();
}

/**
 * Generate the source URL for IDM redirect
 * Points to current hostname + /masterpass so IDM redirects back here after auth
 */
export function getSourceURL(): string {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    return `${protocol}//${hostname}${port}/masterpass`;
  }

  // Server-side fallback
  const appSubdomain = process.env.APP_SUBDOMAIN || "whisperrnote.space";
  const protocol = process.env.NODE_ENV === "development" ? "http:" : "https:";
  return `${protocol}//${appSubdomain}/masterpass`;
}

/**
 * Open the IDM authentication popup or redirect if necessary
 */
export function openAuthPopup(): Window | null {
  const authURL = getAuthURL();
  const loginPath = process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH || "/login";
  const normalizedLoginPath = loginPath.startsWith("/")
    ? loginPath
    : `/${loginPath}`;

  const sourceURL = getSourceURL();

  // Simple check for mobile devices
  const isMobile = typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  let fullUrl = `${authURL}${normalizedLoginPath}`;
  const separator = normalizedLoginPath.includes("?") ? "&" : "?";
  fullUrl = `${fullUrl}${separator}source=${encodeURIComponent(sourceURL)}`;

  if (isMobile) {
    window.location.assign(fullUrl);
    return null; // Signals that we redirected
  }

  const popup = window.open(
    fullUrl.split('?')[0], // Don't pass source to popup to avoid inner redirect
    "auth_popup",
    "width=500,height=700,resizable=yes,scrollbars=yes",
  );

  if (!popup) {
    console.warn("Popup blocked, falling back to redirect in whisperrkeep");
    window.location.assign(fullUrl);
    return null;
  }

  return popup;
}


