import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  experimental: {
    reactCompiler: true,
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lodash',
      'lodash-es',
      'date-fns',
      'framer-motion',
      'lucide-react',
    ],
  },

  // Security Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for some libraries/dev mode
              "style-src 'self' 'unsafe-inline'", // TODO: Remove unsafe-inline, use nonces
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "object-src 'none'", // Disable object/embed/applet
              "connect-src 'self' https://*.appwrite.io https://*.appwrite.global",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "interest-cohort=()",
              "payment=()",
              "usb=()",
              "magnetometer=()",
              "accelerometer=()",
              "gyroscope=()",
            ].join(", "),
          },
          // Force HTTPS (HSTS) - only enable if using HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Prevent DNS Prefetching
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Restrict Adobe Flash and PDF (legacy)
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          // XSS Protection (legacy, but doesn't hurt)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // Additional security configurations
  poweredByHeader: false, // Remove X-Powered-By header
};

export default nextConfig;
