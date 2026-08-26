import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Correct: Top-level property on NextConfig
  allowedDevOrigins: [
    "concise-skunk-preferably.ngrok-free.app", // Replace with your allowed origin/IP if needed
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Allow localhost images
    dangerouslyAllowLocalIP: true, // Add this to allow local IPs
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      // For external images like Unsplash
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    // If you don't want to use dangerouslyAllowLocalIP, you can use domains
    // domains: ['localhost', '127.0.0.1'],
  },
};

export default nextConfig;
