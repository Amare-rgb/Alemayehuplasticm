// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Normalize the backend URL: no trailing slash, no trailing "/api".
// (A trailing slash used to create "//uploads/..." in the rewrite below.)
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

type ImagePattern = {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
};

// Allow images from whatever backend NEXT_PUBLIC_API_URL points to
// (Railway in production, localhost in development).
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
    // ⚠️ Only keep this if you must ship despite TS errors.
    // Strongly recommended to fix the errors and remove this line.
    ignoreBuildErrors: true,
  },

  images: {
    // Only allow fetching from private/local IPs while developing.
    // In production this stays off (it is a security risk there).
    dangerouslyAllowLocalIP: !isProd,

    remotePatterns: [
      // ── Backend from NEXT_PUBLIC_API_URL (Railway / localhost) ──────
      ...(apiPattern ? [apiPattern] : []),

      // ── Local backend (development) ─────────────────────────────────
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "5000", pathname: "/**" },

      // ── Production backend on Railway (explicit fallback) ───────────
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

  // Proxy /uploads/* from Next.js to the Express backend.
  // Only needed for local development files; production images now
  // live on Cloudinary with full https://res.cloudinary.com/... URLs.
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${API_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;