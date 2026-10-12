import type { NextConfig } from "next";

import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // በDevelopment ጊዜ PWA እንዲጠፋ (Build ስታደርግ ግን ይሠራል)
});

const isProd = process.env.NODE_ENV === "production";

// Normalize the backend URL: no trailing slash, no trailing "/api".
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+\$/, "")
  .replace(/\/api\$/i, "");

type ImagePattern = {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
};

// Allow images from whatever backend NEXT_PUBLIC_API_URL points to
const apiPattern: ImagePattern | null = (() => {
  try {
    const u = new URL(API_URL);
    return {
      protocol: u.protocol === "https:" ? "https" : "http",
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/**",
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // Allow dev requests from your ngrok tunnel origin
  allowedDevOrigins: ["concise-skunk-preferably.ngrok-free.app"],

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    dangerouslyAllowLocalIP: !isProd,

    remotePatterns: [
      // ── Backend from NEXT_PUBLIC_API_URL ────────────────────────────
      ...(apiPattern ? [apiPattern] : []),

      // ── Local backend (development) ─────────────────────────────────
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "5000", pathname: "/**" },

      // ── Production backend on Railway ───────────────────────────────
      {
        protocol: "https",
        hostname: "genesis-production-1d52.up.railway.app",
        pathname: "/**",
      },

      // ── Cloudinary (permanent product images) ───────────────────────
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },

      // ── Other external image hosts ──────────────────────────────────
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
    ],
  },

  // Proxy /uploads/* from Next.js to the Express backend
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${API_URL}/uploads/:path*`,
      },
    ];
  },
};

export default withPWA(nextConfig);