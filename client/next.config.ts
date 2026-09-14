// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev requests from your ngrok tunnel origin
  allowedDevOrigins: [
    "concise-skunk-preferably.ngrok-free.app",
  ],

  typescript: {
    // Keep this only if you *must* ship despite TS errors.
    // Strongly recommended to fix the errors and remove this line.
    ignoreBuildErrors: true,
  },

  images: {
    // ✅ Correct — allows images fetched from private/local IPs in dev
    dangerouslyAllowLocalIP: true,

    remotePatterns: [
      // ── Local backend uploads (products) ───────────────────────────
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
        pathname: "/uploads/**",
      },

      // ── Local backend — any path (keep if you also serve other assets)
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**",
      },

      // ── External images ─────────────────────────────────────────────
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },

      // ── Optional but useful hosts ───────────────────────────────────
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google avatars
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // GitHub avatars
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;