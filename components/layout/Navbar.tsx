"use client";

import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/app/providers";
import Link from "next/link";
import { useAppwrite } from "@/app/appwrite-provider";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import PasswordGenerator from "@/components/ui/PasswordGenerator";
import { useAI } from "@/app/context/AIContext";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, logout, openIDMWindow } = useAppwrite();
  const { openAIModal } = useAI();
  const [showMenu, setShowMenu] = useState(false);
  const pathname = usePathname();

  const isCorePage = [
    "/dashboard",
    "/credentials",
    "/totp",
    "/settings",
    "/import",
    "/sharing",
    "/overview"
  ].some(path => pathname?.startsWith(path));

  return (
    <nav className="border-b border-border fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 animate-fadeIn">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center h-16 px-4 relative">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="Whisperrkeep Logo"
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="font-semibold text-lg hidden sm:inline">
            Whisperrkeep
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {/* AI Wand Button - Only visible for authenticated users AND core pages */}
          {user && isCorePage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={openAIModal}
              className="text-primary hover:text-primary hover:bg-primary/10"
              title="AI Assistant"
            >
              <SparklesIcon className="h-5 w-5" />
            </Button>
          )}

          <button
            className="p-2 rounded-full hover:bg-accent"
            onClick={() => {
              const nextTheme =
                theme === "light"
                  ? "dark"
                  : theme === "dark"
                    ? "system"
                    : "light";
              setTheme(nextTheme);
            }}
          >
            {theme === "light" && <SunIcon className="h-5 w-5" />}
            {theme === "dark" && <MoonIcon className="h-5 w-5" />}
            {theme === "system" && <ComputerDesktopIcon className="h-5 w-5" />}
          </button>
          <DropdownMenu
            trigger={
              <button
                className="p-2 rounded-full hover:bg-accent"
                title="Password Generator"
              >
                <KeyIcon className="h-5 w-5" />
              </button>
            }
            width="400px"
            align="right"
          >
            <div className="p-2">
              <PasswordGenerator />
            </div>
          </DropdownMenu>
          {!user ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  openIDMWindow();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Failed to open authentication");
                }
              }}
            >
              Connect
            </Button>
          ) : (
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="flex items-center gap-2"
                onClick={() => setShowMenu((v) => !v)}
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {user.name || user.email}
                </span>
              </Button>
              {showMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg z-50"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <div className="px-4 py-3 border-b">
                    <div className="font-medium">{user.name || user.email}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                  <Link href="/settings">
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
                      onClick={() => setShowMenu(false)}
                    >
                      Account Settings
                    </button>
                  </Link>
                  {/* Mobile-only: Lock now in account dropdown */}
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-accent text-sm flex items-center gap-2 sm:hidden"
                    onClick={() => {
                      // Lock immediately and redirect to masterpass
                      import("next/navigation").then(
                        () => {
                          // Note: cannot use hooks here; fallback to direct masterPassCrypto + location
                          Promise.resolve().then(async () => {
                            const { masterPassCrypto } = await import(
                              "@/app/(protected)/masterpass/logic"
                            );
                            masterPassCrypto.lockNow();
                            try {
                              const path = window.location.pathname;
                              sessionStorage.setItem(
                                "masterpass_return_to",
                                path,
                              );
                              window.location.replace("/masterpass");
                            } catch {
                              window.location.href = "/masterpass";
                            }
                          });
                        },
                      );
                      setShowMenu(false);
                    }}
                  >
                    <ShieldCheckIcon className="h-4 w-4" />
                    Lock now
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-accent text-sm flex items-center gap-2 text-destructive"
                    onClick={async () => {
                      setShowMenu(false);
                      await logout();
                    }}
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
