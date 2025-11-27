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
 * Open the IDM authentication popup
 */
export function openAuthPopup(): void {
  const authURL = getAuthURL();
  const loginPath =
    process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH || "/login";
  const normalizedLoginPath = loginPath.startsWith("/")
    ? loginPath
    : `/${loginPath}`;
  const popup = window.open(
    `${authURL}${normalizedLoginPath}`,
    "auth_popup",
    "width=500,height=700,resizable=yes,scrollbars=yes",
  );

  if (!popup) {
    throw new Error("Failed to open authentication popup. Please check popup settings.");
  }

  // Poll to detect if popup was closed without completing auth
  let pollCount = 0;
  const maxPolls = 600; // 10 minutes (600 * 1s)
  
  const pollPopup = setInterval(() => {
    pollCount++;
    
    // Check if popup is closed
    if (popup.closed) {
      clearInterval(pollPopup);
      return;
    }
    
    // Timeout after 10 minutes
    if (pollCount >= maxPolls) {
      clearInterval(pollPopup);
      popup.close();
      return;
    }
  }, 1000);
}

