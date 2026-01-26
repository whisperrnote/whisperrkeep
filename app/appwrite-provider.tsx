"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  appwriteAccount,
  resetMasterpassAndWipe,
  hasMasterpass,
  logoutAppwrite,
} from "@/lib/appwrite";
import { getAuthOrigin, openAuthPopup } from "@/lib/authUrl";
import { masterPassCrypto } from "./(protected)/masterpass/logic";
import { logDebug, logWarn } from "@/lib/logger";

// Types
import type { Models } from "appwrite";

interface AppwriteContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  isVaultUnlocked: () => boolean;
  needsMasterPassword: boolean;
  logout: () => Promise<void>;
  resetMasterpass: () => Promise<void>;
  refresh: () => Promise<void>;
  openIDMWindow: () => Promise<void>;
  closeIDMWindow: () => void;
  idmWindowOpen: boolean;
}

const AppwriteContext = createContext<AppwriteContextType | undefined>(
  undefined,
);

interface AppwriteError extends Error {
  code?: number;
  response?: unknown;
}

export function AppwriteProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [needsMasterPassword, setNeedsMasterPassword] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [idmWindowOpen, setIDMWindowOpen] = useState(false);
  const idmWindowRef = useRef<Window | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const verbose = process.env.NODE_ENV === "development";

  // Fetch current user and check master password status
  const fetchUser = useCallback(async (isRetry = false, retryCount = 0) => {
    if (!isRetry) setLoading(true);
    try {
      const account = await appwriteAccount.get();
      setUser(account);

      if (verbose)
        logDebug("[auth] account.get success", { hasAccount: !!account });

      if (account) {
        // Clear the auth=success param from URL if it exists
        if (typeof window !== 'undefined' && window.location.search.includes('auth=success')) {
          const url = new URL(window.location.href);
          url.searchParams.delete('auth');
          window.history.replaceState({}, '', url.toString());
        }

        const hasMp = await hasMasterpass(account.$id);
        const unlocked = masterPassCrypto.isVaultUnlocked();
        if (verbose)
          logDebug("[auth] master password status", {
            hasMasterpass: hasMp,
            unlocked,
          });
        setNeedsMasterPassword(!hasMp || !unlocked);
      } else {
        setNeedsMasterPassword(false);
      }
      return account;
    } catch (err: unknown) {
      const e = err as AppwriteError;
      
      // Check for auth=success signal in URL
      const hasAuthSignal = typeof window !== 'undefined' && window.location.search.includes('auth=success');
      
      if (hasAuthSignal && retryCount < 3) {
        logWarn(`[auth] Auth signal detected but session not found in keep. Retrying... (${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchUser(true, retryCount + 1);
      }

      if (verbose) logWarn("[auth] account.get error", { error: e });

      const isNetworkError = !e.response && (e.message?.includes('Network Error') || e.message?.includes('Failed to fetch'));

      if (e.code === 401) {
        // If it's a 401 and not a retry, let attemptSilentAuth handle it
        if (!isRetry) throw e;
        setUser(null);
        setNeedsMasterPassword(false);
      } else if (!isNetworkError) {
        setUser(null);
        setNeedsMasterPassword(false);
      } else {
        logWarn("[auth] Network error, retaining last session state");
      }
      return null;
    } finally {
      if (!isRetry) setLoading(false);
      setIsAuthReady(true);
    }
  }, [verbose]);

  const attemptSilentAuth = useCallback(async () => {
    if (typeof window === "undefined") return;

    const authSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN;
    const domain = process.env.NEXT_PUBLIC_DOMAIN;
    if (!authSubdomain || !domain) return;

    return new Promise<void>((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://${authSubdomain}.${domain}/silent-check`;
      iframe.style.display = "none";

      const timeout = setTimeout(() => {
        cleanup();
        resolve();
      }, 5000);

      const handleIframeMessage = (event: MessageEvent) => {
        if (event.origin !== `https://${authSubdomain}.${domain}`) return;

        if (
          event.data?.type === "idm:auth-status" &&
          event.data.status === "authenticated"
        ) {
          logDebug("[auth] Silent auth discovered session");
          fetchUser(true); // retry fetch
          cleanup();
          resolve();
        } else if (event.data?.type === "idm:auth-status") {
          cleanup();
          resolve();
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        window.removeEventListener("message", handleIframeMessage);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };

      window.addEventListener("message", handleIframeMessage);
      document.body.appendChild(iframe);
    });
  }, [fetchUser]);

  const openIDMWindow = useCallback(async () => {
    if (typeof window === "undefined" || isAuthenticating) return;

    setIsAuthenticating(true);

    // First, check if we already have a session locally
    try {
      const account = await appwriteAccount.get();
      if (account) {
        console.log("[auth] Active session detected, skipping IDM window");
        setUser(account);
        setIsAuthenticating(false);
        if (pathname === "/" || pathname === "/landing") {
          router.replace("/masterpass");
        }
        return;
      }
    } catch (e) {
      // No session, proceed to silent check
    }

    // Try silent auth before opening popup
    await attemptSilentAuth();
    try {
      const account = await appwriteAccount.get();
      if (account) {
        setUser(account);
        setIsAuthenticating(false);
        if (pathname === "/" || pathname === "/landing") {
          router.replace("/masterpass");
        }
        return;
      }
    } catch (e) {
      // Still no session
    }

    if (idmWindowRef.current && !idmWindowRef.current.closed) {
      idmWindowRef.current.focus();
      return;
    }

    try {
      const popup = openAuthPopup();
      if (popup) {
        idmWindowRef.current = popup;
        setIDMWindowOpen(true);
      } else {
        setIsAuthenticating(false);
      }
    } catch (error) {
      console.error("Failed to open IDM window:", error);
      setIsAuthenticating(false);
    }
  }, [pathname, router, isAuthenticating, attemptSilentAuth]);

  const closeIDMWindow = useCallback(() => {
    if (idmWindowRef.current && !idmWindowRef.current.closed) {
      idmWindowRef.current.close();
    }
    idmWindowRef.current = null;
    setIDMWindowOpen(false);
    setIsAuthenticating(false);
  }, []);

  // Listen for auth success messages from IDM
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const expectedOrigin = getAuthOrigin();
      if (event.origin !== expectedOrigin) return;

      if (event.data?.type === "idm:auth-success") {
        logDebug("[auth] Received auth success message from IDM");
        
        // Close the window first for better UX
        closeIDMWindow();
        setIsAuthenticating(false);
        
        // Refresh user state
        const account = await fetchUser(true);
        
        // Redirect to masterpass if authenticated
        if (account) {
          router.replace("/masterpass");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchUser, closeIDMWindow, router]);

  // Poll for window closure as a fallback
  useEffect(() => {
    if (!idmWindowOpen) return;

    const interval = setInterval(() => {
      if (idmWindowRef.current && idmWindowRef.current.closed) {
        clearInterval(interval);
        idmWindowRef.current = null;
        setIDMWindowOpen(false);
        setIsAuthenticating(false);
        fetchUser(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [idmWindowOpen, fetchUser]);

  // Initial load and authentication check orchestration
  useEffect(() => {
    const initAuth = async () => {
      try {
        await fetchUser();
      } catch (err: unknown) {
        const e = err as AppwriteError;
        if (e.code === 401) {
          await attemptSilentAuth();
        }
      } finally {
        setLoading(false);
        setIsAuthReady(true);
      }
    };

    initAuth();

    // Listen for vault lock events
    const handleVaultLocked = () => {
      setTimeout(() => setNeedsMasterPassword(true), 0);
    };
    window.addEventListener("vault-locked", handleVaultLocked);

    // Listen for storage changes (multi-tab logout)
    const handleStorageChange = () => fetchUser();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("vault-locked", handleVaultLocked);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchUser, attemptSilentAuth]);

  const refresh = async () => {
    await fetchUser();
  };

  const logout = async () => {
    await logoutAppwrite();
    masterPassCrypto.lock();
    setUser(null);
    setNeedsMasterPassword(false);
  };

  const resetMasterpass = async () => {
    if (!user) return;
    await resetMasterpassAndWipe(user.$id);
    masterPassCrypto.lock();
    setNeedsMasterPassword(true);
  };

  const isVaultUnlocked = () => {
    const unlocked = masterPassCrypto.isVaultUnlocked();
    if (verbose) logDebug("[auth] vault unlock status", { unlocked });
    return unlocked;
  };

  return (
    <AppwriteContext.Provider
      value={{
        user,
        loading,
        isAuthenticating,
        isAuthenticated: !!user,
        isAuthReady,
        isVaultUnlocked,
        needsMasterPassword,
        logout,
        resetMasterpass,
        refresh,
        openIDMWindow,
        closeIDMWindow,
        idmWindowOpen,
      }}
    >
      {children}
    </AppwriteContext.Provider>
  );
}

// Custom hook for easy access
export function useAppwrite() {
  const ctx = useContext(AppwriteContext);
  if (!ctx) throw new Error("useAppwrite must be used within AppwriteProvider");
  return ctx;
}
