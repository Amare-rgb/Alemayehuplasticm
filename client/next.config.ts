// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev requests from your ngrok tunnel origin
  allowedDevOrigins: [
    "concise-skunk-preferably.ngrok-free.app",
  ],

  typescript: {
    // ⚠️ Only keep this if you must ship despite TS errors.
    // Strongly recommended to fix the errors and remove this line.
    ignoreBuildErrors: true,
  },

  images: {
    // Allows images fetched from private/local IPs in dev
    dangerouslyAllowLocalIP: true,

    remotePatterns: [
      // ── Local backend (all paths on :5000) ──────────────────────────
      // This covers /uploads/** and every other path served by your
      // Express backend during development.
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
        pathname: "/**",
      },

      // ── External image hosts ────────────────────────────────────────
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
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },

      // ── Production API host — update before deploy ──────────────────
      // Example: if your production API is on https://api.yourdomain.com
      // {
      //   protocol: "https",
      //   hostname: "api.yourdomain.com",
      //   pathname: "/uploads/**",
      // },
    ],
  },

  // Proxy /uploads/* from Next.js (port 3000) to the Express backend
  // (port 5000). Without this, browser requests for
  // /uploads/products/xxx.jpg hit Next.js, which has no such file,
  // returning 404 → "The requested resource isn't a valid image".
  //
  // The destination uses NEXT_PUBLIC_API_URL so this works in both dev
  // (localhost) and prod (your deployed API domain).
  async rewrites() {
    const backend =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    return [
      {
        source: "/uploads/:path*",
        destination: `${backend}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;