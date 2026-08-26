import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Correct: Top-level property on NextConfig
  allowedDevOrigins: [
    "concise-skunk-preferably.ngrok-free.app", // Replace with your allowed origin/IP if needed
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
