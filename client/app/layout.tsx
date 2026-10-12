// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";
import ChatbotToggle from "@/components/ChatbotToggle";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

// ============================================================
// Site metadata
// ============================================================
export const metadata: Metadata = {
  title: {
    default: "Alemayehu Plastic Manufacturing",
    template: "%s | Alemayehu Plastic Manufacturing",
  },
  description:
    "High-quality plastic products for homes, businesses and industries across Ethiopia.",
  applicationName: "Alemayehu Plastic Manufacturing",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alemayehu Plastic",
  },
  icons: {
    icon: [
      { url: "/banners/plastik.png", sizes: "any" },
      { url: "/banners/plastik.png", type: "image/png", sizes: "192x192" },
      { url: "/banners/plastik.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/banners/plastik.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/banners/plastik.png"],
  },
  formatDetection: {
    telephone: false,
  },
};

// ============================================================
// Viewport — controls the browser chrome / status bar theme
// ============================================================
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    // Light mode browser UI
    { media: "(prefers-color-scheme: light)", color: "#e0a83c" },
    // Dark mode browser UI
    { media: "(prefers-color-scheme: dark)", color: "#1a1410" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${sora.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-gray-50 text-gray-900 antialiased"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        <Providers>
          {/* Navbar is fixed + transparent on /, /about, /shop, /contact
              so do NOT add top padding around {children} */}
          <Navbar />
          {children}
          <Footer />
          <Toaster position="top-right" />
          <ChatbotToggle />

          {/* PWA Install Prompt — appears bottom-right when installable */}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}