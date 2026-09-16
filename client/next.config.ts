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
    // ✅ Allows images fetched from private/local IPs in dev
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

      // ── Local backend — any path ────────────────────────────────────
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
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // ✅ NEW: Proxy /uploads/* from Next.js (port 3000) to the Express
  //    backend (port 5000). Without this, the browser's request for
  //    /uploads/products/xxx.jpg hits the Next.js server, which has no
  //    such file and returns 404 — producing
  //    "The requested resource isn't a valid image ... received null".
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return [
      {
        source: "/uploads/:path*",
        destination: `${backend}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;