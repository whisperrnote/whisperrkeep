"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const authSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN;
    const appSubdomain = process.env.NEXT_PUBLIC_APP_SUBDOMAIN;
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;

    if (authSubdomain && appSubdomain && appDomain) {
      const redirectUrl = `https://${authSubdomain}.${appDomain}?source=${appSubdomain}.${appDomain}`;
      window.location.href = redirectUrl;
    }
  }, [router]);

  return <div>Redirecting to login...</div>;
}
