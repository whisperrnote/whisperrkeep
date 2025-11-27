"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Home,
  PlusCircle,
  Share2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/app/providers";
import { useAppwrite } from "@/app/appwrite-provider";
import clsx from "clsx";
import { masterPassCrypto } from "@/app/(protected)/masterpass/logic";
import { Navbar } from "./Navbar";
import { PasskeySetup } from "@/components/overlays/passkeySetup";
import type { Models } from "appwrite";

interface ExtendedUser extends Models.User<Models.Preferences> {
  mustCreatePasskey?: boolean;
  isPasskey?: boolean;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Sharing", href: "/sharing", icon: Share2 },
  { name: "New", href: "/credentials/new", icon: PlusCircle, big: true },
  { name: "TOTP", href: "/totp", icon: Shield },
  { name: "Import", href: "/import", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
];

const SIMPLIFIED_LAYOUT_PATHS = [
  "/",
  "/masterpass",
  "/masterpass/reset",
  "/twofa/access",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, loading, logout, refresh } = useAppwrite();
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);

  const isSimplifiedLayout = SIMPLIFIED_LAYOUT_PATHS.includes(pathname);

  useEffect(() => {
    if (user && !loading) {
      const extendedUser = user as ExtendedUser;
      const shouldEnforcePasskey =
        extendedUser.mustCreatePasskey ||
        (process.env.NEXT_PUBLIC_PASSKEY_ENFORCE === "true" && !extendedUser.isPasskey);
      if (shouldEnforcePasskey && masterPassCrypto.isVaultUnlocked()) {
        setShowPasskeySetup(true);
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !user && !isSimplifiedLayout) {
      router.replace("/masterpass");
    }
  }, [loading, user, isSimplifiedLayout, router]);

  useEffect(() => {
    if (user && !isSimplifiedLayout) {
      masterPassCrypto.updateActivity();
      let intervalId: number | undefined;

      const keepAlive = () => masterPassCrypto.updateActivity();

      const startWatcher = () => {
        clearInterval(intervalId as number);
        intervalId = window.setInterval(() => {
          if (!masterPassCrypto.isVaultUnlocked()) {
            sessionStorage.setItem("masterpass_return_to", pathname);
            router.replace("/masterpass");
            clearInterval(intervalId as number);
          }
        }, 1000);
      };

      const handleActivity = () => keepAlive();

      window.addEventListener("mousemove", handleActivity);
      window.addEventListener("mousedown", handleActivity);
      window.addEventListener("keydown", handleActivity);
      window.addEventListener("scroll", handleActivity, { passive: true });
      window.addEventListener("touchstart", handleActivity, { passive: true });
      window.addEventListener("focus", handleActivity);
      window.addEventListener("click", handleActivity);

      const handleVisibility = () => {
        if (!masterPassCrypto.isVaultUnlocked()) {
          sessionStorage.setItem("masterpass_return_to", pathname);
          router.replace("/masterpass");
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);

      startWatcher();

      if (!masterPassCrypto.isVaultUnlocked()) {
        sessionStorage.setItem("masterpass_return_to", pathname);
        router.replace("/masterpass");
      }

      return () => {
        window.removeEventListener("mousemove", handleActivity);
        window.removeEventListener("mousedown", handleActivity);
        window.removeEventListener("keydown", handleActivity);
        window.removeEventListener("scroll", handleActivity);
        window.removeEventListener("touchstart", handleActivity);
        window.removeEventListener("focus", handleActivity);
        window.removeEventListener("click", handleActivity);
        document.removeEventListener("visibilitychange", handleVisibility);
        clearInterval(intervalId as number);
      };
    }
  }, [user, isSimplifiedLayout, pathname, router]);

  const ThemeIcon = () => {
    switch (theme) {
      case "light":
        return Sun;
      case "dark":
        return Moon;
      default:
        return Monitor;
    }
  };

  const ThemeSymbol = ThemeIcon();

  if (isSimplifiedLayout) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  if (!loading && !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Navbar />

      <div className="flex-1 flex w-full overflow-x-hidden pt-16">
        <aside
          className={clsx(
            "hidden lg:block",
            "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r overflow-y-auto z-30",
          )}
          aria-label="Primary sidebar navigation"
        >
          <div className="flex flex-col h-full">
            <nav className="flex-1 px-2 py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const isBig = item.big;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                      isBig && "text-base py-3",
                    )}
                  >
                    <item.icon className={clsx("h-5 w-5", isBig && "h-7 w-7")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="px-2 py-3 border-t space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3"
                onClick={() => {
                  const themes: Array<"light" | "dark" | "system"> = [
                    "light",
                    "dark",
                    "system",
                  ];
                  const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
                  setTheme(nextTheme);
                }}
              >
                <ThemeSymbol className="h-4 w-4" />
                {`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme`}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3"
                onClick={() => {
                  masterPassCrypto.lockNow();
                  if (!masterPassCrypto.isVaultUnlocked()) {
                    sessionStorage.setItem("masterpass_return_to", pathname);
                    router.replace("/masterpass");
                  }
                }}
              >
                <Shield className="h-4 w-4" />
                Lock now
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden lg:ml-64">
          <main className="flex-1 px-2 py-4 sm:px-3 md:px-4 lg:px-4 pb-20 lg:pb-6 overflow-x-hidden max-w-full">
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/100 border-t flex lg:hidden justify-around items-center h-16 shadow-lg safe-area-inset-bottom">
        {navigation
          .filter((item) => item.name !== "Import")
          .map((item) => {
            const isActive = pathname === item.href;
            const isBig = item.big;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center p-2 min-w-0 flex-1",
                  isBig ? "scale-110" : "",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary",
                )}
                aria-label={item.name}
              >
                <item.icon
                  className={clsx(
                    "mb-1 flex-shrink-0",
                    isBig ? "h-7 w-7" : "h-5 w-5",
                  )}
                />
                <span className={clsx("text-xs truncate", isBig && "font-semibold")}>{item.name}</span>
              </Link>
            );
          })}
      </nav>

      {user && (
        <PasskeySetup
          isOpen={showPasskeySetup}
          onClose={() => setShowPasskeySetup(false)}
          userId={user.$id}
          isEnabled={false}
          onSuccess={() => {
            setShowPasskeySetup(false);
            refresh();
          }}
          trustUnlocked={true}
        />
      )}
    </div>
  );
}
