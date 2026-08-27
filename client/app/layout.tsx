// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter' 
});

const sora = Sora({ 
  subsets: ['latin'], 
  variable: '--font-sora' 
});

export const metadata: Metadata = {
  title: 'Genesis Agri - Agricultural Marketplace',
  description: 'Buy and sell agricultural products from trusted sellers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <Navbar />
          {children}
          <Footer />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}