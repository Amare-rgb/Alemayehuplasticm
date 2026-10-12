// client/types/next-pwa.d.ts
declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    scope?: string;
    sw?: string;
    runtimeCaching?: unknown[];
    publicExcludes?: string[];
    buildExcludes?: (string | RegExp)[];
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    cacheOnFrontEndNav?: boolean;
    reloadOnOnline?: boolean;
    customWorkerDir?: string;
    customWorkerSrc?: string;
    dynamicStartUrl?: boolean;
    dynamicStartUrlRedirect?: string;
    subdomainPrefix?: string;
  }

  type NextPWA = (config?: PWAConfig) => (nextConfig: NextConfig) => NextConfig;

  const withPWAInit: NextPWA;
  export default withPWAInit;
}