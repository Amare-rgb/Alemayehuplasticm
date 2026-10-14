// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alemayehu Plastic Manufacturing',
    short_name: 'Alemayehu Plastic',
    description: 'Quality plastic products manufactured in Ethiopia',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf6ee',
    theme_color: '#e0a83c',
    icons: [
      {
        src: '/banners/plastik.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/banners/plastik.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}