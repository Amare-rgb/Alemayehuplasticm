// next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const isProd = process.env.NODE_ENV === "production";

// ─────────────────────────────────────────────────────────────
// Normalize the backend URL:
//   • trim whitespace
//   • remove trailing slashes        (e.g. ".../" → "...")
//   • remove trailing "/api"         (e.g. ".../api" → "...")
// ─────────────────────────────────────────────────────────────
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "")     // ✅ was /\/+\$/ — $ was escaped
  .replace(/\/api$/i, ""); // ✅ was /\/api\$/i — $ was escaped

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

  // ⚠️ Removed ignoreBuildErrors — your build passes cleanly now.
  //    If you need it back temporarily, uncomment.
  // typescript: { ignoreBuildErrors: true },

  images: {
    dangerouslyAllowLocalIP: !isProd,

    remotePatterns: [
      // ── Backend from NEXT_PUBLIC_API_URL ────────────────────────────
      ...(apiPattern ? [apiPattern] : []),

      // ── Local backend (development) ─────────────────────────────────
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "5000", pathname: "/**" },

      // ── Cloudinary (all product / avatar / category images) ─────────
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },

      // ── Other external image hosts ──────────────────────────────────
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
    ],
  },

  // ✅ Removed /uploads/* rewrite — local disk storage is gone.
  //    All uploads now go to Cloudinary, so no proxy is needed.
};

export default withPWA(nextConfig);