import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google' 
import { Toaster } from 'react-hot-toast'
import { Navbar } from '@/components/layout/Navbar'
import { Providers } from '@/components/layout/Providers'
import './globals.css'
import { cn } from "@/lib/utils"


const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter' 
})

const sora = Sora({ 
  subsets: ['latin'], 
  variable: '--font-sora' 
})

export const metadata: Metadata = {
  title: 'ShopHub — Your Multi-Vendor Marketplace',
  description: 'Buy and sell products from thousands of trusted sellers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      // ስህተት የነበረውን geist.variable አውጥተን በ inter እና sora ተክተነዋል
      className={cn(inter.variable, sora.variable, "font-sans")}
    >
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <Navbar />
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}