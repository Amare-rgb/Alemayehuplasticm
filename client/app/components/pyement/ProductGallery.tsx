'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react'

interface ProductGalleryProps {
  images: string[]
  name?: string
}

export default function ProductGallery({ images, name = 'Product' }: ProductGalleryProps) {
  const validImages = images && images.filter(img => img && img.trim() !== '').length > 0
    ? images.filter(img => img && img.trim() !== '')
    : ['/banners/images.jpeg']
  const [main, setMain] = useState(validImages[0] || '/banners/images.jpeg')
  const [isZoomed, setIsZoomed] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Full-screen modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Amazon-style hover zoom states
  const [isHovering, setIsHovering] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)
  const hasImages = validImages.length > 0

  // Handle mouse movement for Amazon-style zoom
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    
    // Get container dimensions and position
    const rect = containerRef.current.getBoundingClientRect()
    
    // Calculate mouse position relative to container (0-100%)
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    // Clamp values between 0 and 100
    setMousePosition({
      x: Math.min(Math.max(x, 0), 100),
      y: Math.min(Math.max(y, 0), 100)
    })
  }, [])

  const handleMouseEnter = () => setIsHovering(true)
  const handleMouseLeave = () => {
    setIsHovering(false)
    setIsZoomed(false)
  }

  const handleThumbnailClick = (img: string, index: number) => {
    setMain(img)
    setCurrentIndex(index)
    setIsZoomed(false)
  }

  const nextImage = () => {
    if (hasImages) {
      const nextIndex = (currentIndex + 1) % validImages.length
      setMain(validImages[nextIndex])
      setCurrentIndex(nextIndex)
      setIsZoomed(false)
    }
  }

  const prevImage = () => {
    if (hasImages) {
      const prevIndex = (currentIndex - 1 + validImages.length) % validImages.length
      setMain(validImages[prevIndex])
      setCurrentIndex(prevIndex)
      setIsZoomed(false)
    }
  }

  // Open full-screen modal
  const openModal = () => {
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  // Close full-screen modal
  const closeModal = () => {
    setIsModalOpen(false)
    document.body.style.overflow = 'unset'
  }

  // Handle keyboard navigation in modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return
      
      if (e.key === 'Escape') {
        closeModal()
      } else if (e.key === 'ArrowLeft') {
        prevImage()
      } else if (e.key === 'ArrowRight') {
        nextImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, currentIndex, validImages])

  // Clean up body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  if (!hasImages) {
    return (
      <div className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
        <div className="aspect-square flex items-center justify-center">
          <div className="text-center">
            <svg 
              className="w-24 h-24 mx-auto text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="mt-4 text-gray-500 text-sm">No images available</p>
            <p className="text-gray-400 text-xs mt-1">{name}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Thumbnails - Desktop */}
        <div className="col-span-1 hidden md:block">
          <div 
            className="space-y-2 max-h-[500px] overflow-y-auto pr-2"
            role="region"
            aria-label="Product thumbnail gallery"
          >
            {validImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleThumbnailClick(img, i)}
                className={`w-full aspect-square bg-white border-2 rounded-lg overflow-hidden flex items-center justify-center transition-all hover:shadow-md ${
                  main === img 
                    ? 'border-indigo-500 ring-2 ring-indigo-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label={`View product image ${i + 1} of ${validImages.length}`}
                aria-current={main === img ? 'true' : 'false'}
                title={`View image ${i + 1}`}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={img}
                    alt={`${name} thumbnail ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/placeholder-image.jpg'
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Image with Amazon-style Hover Zoom */}
        <div className="col-span-5">
          <div className="relative group">
            {/* Main image container with hover tracking */}
            <div 
              ref={containerRef}
              className="relative bg-gray-50 rounded-xl overflow-hidden cursor-pointer"
              style={{ aspectRatio: '1/1' }}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={openModal}
            >
              {main ? (
                <>
                  <div className="relative w-full h-full">
                    <Image
                      src={main}
                      alt={name ? `${name} - main product image` : 'Product main image'}
                      title={name || 'Product image'}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={`object-contain transition-transform duration-300 ${
                        isZoomed ? 'scale-150' : 'scale-100'
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/placeholder-image.jpg'
                      }}
                      priority
                    />
                  </div>
                  
                  {/* Floating Lens Overlay (Amazon-style magnifier glass) */}
                  {isHovering && !isZoomed && (
                    <div 
                      className="absolute w-40 h-40 bg-indigo-500/10 border-2 border-indigo-500 rounded-full pointer-events-none z-10 transition-opacity duration-150"
                      style={{
                        left: `${mousePosition.x}%`,
                        top: `${mousePosition.y}%`,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.5), 0 0 0 2px rgba(0,0,0,0.1)'
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <svg 
                    className="w-20 h-20 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* SIDE ZOOM WINDOW - Amazon-style magnifier (Desktop only) */}
            {isHovering && !isZoomed && main && (
              <div 
                className="absolute left-[102%] top-0 w-[400px] h-[400px] z-50 hidden lg:block rounded-xl shadow-2xl border-2 border-gray-200 bg-white overflow-hidden"
                style={{
                  backgroundImage: `url(${main})`,
                  backgroundSize: '250%',
                  backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#f9fafb'
                }}
              >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-transparent to-white/5" />
              </div>
            )}

            {/* Navigation buttons */}
            {hasImages && validImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Previous image"
                  title="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Next image"
                  title="Next image"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}

            {/* Zoom button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsZoomed(!isZoomed)
              }}
              className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
              title={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              <ZoomIn className="w-4 h-4 text-gray-700" />
            </button>

            {/* Full-screen button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                openModal()
              }}
              className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="View full screen"
              title="View full screen"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            {/* Image counter */}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
              {currentIndex + 1} / {validImages.length}
            </div>
          </div>

          {/* Mobile thumbnails */}
          {hasImages && validImages.length > 1 && (
            <div className="md:hidden mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                All images
              </label>
              <div 
                className="grid grid-cols-4 gap-2"
                role="region"
                aria-label="Mobile thumbnail gallery"
              >
                {validImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleThumbnailClick(img, i)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      main === img 
                        ? 'border-indigo-500 ring-2 ring-indigo-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    aria-label={`View image ${i + 1}`}
                    title={`View image ${i + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`${name} thumbnail ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 25vw"
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/placeholder-image.jpg'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL-SCREEN OVERLAY (MODAL) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Full screen image viewer"
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            aria-label="Close full screen viewer"
            title="Close (Esc)"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation buttons in modal */}
          {hasImages && validImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all duration-200 z-40"
                aria-label="Previous image"
                title="Previous image (←)"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all duration-200 z-40"
                aria-label="Next image"
                title="Next image (→)"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}

          {/* Main image in modal */}
          <div 
            ref={modalContainerRef}
            className="relative w-full h-full flex items-center justify-center p-4 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
              <Image
                src={main}
                alt={name ? `${name} - full screen view` : 'Product full screen'}
                fill
                className="object-contain"
                sizes="100vw"
                priority
                quality={100}
              />
            </div>
          </div>

          {/* Image counter in modal */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full">
            {currentIndex + 1} / {validImages.length}
          </div>

          {/* Image name in modal */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full">
            {name}
          </div>
        </div>
      )}
    </>
  )
}