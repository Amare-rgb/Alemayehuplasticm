"use client"
import React from 'react'

type PictureProps = React.ImgHTMLAttributes<HTMLImageElement> & { src?: string | null }

export default function Picture({ src, alt, className, ...rest }: PictureProps) {
  if (src) {
    return <img src={src} alt={alt || ''} title={alt || ''} className={className} {...rest} />
  }

  return (
    <div className={className} aria-hidden>
      <svg width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <rect width="100%" height="100%" fill="#f3f4f6" />
        <g transform="translate(40,60)" fill="#e5e7eb">
          <rect width="120" height="80" rx="6" />
          <circle cx="20" cy="20" r="10" fill="#d1d5db" />
        </g>
      </svg>
    </div>
  )
}
