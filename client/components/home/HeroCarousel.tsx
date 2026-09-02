// src/components/home/HeroCarousel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sprout } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  image?: string;
  href?: string;
  buttonText?: string;
  buttonLink?: string;
  badge?: string;
  badgeColor?: string;
}

// Define the banner type properly
interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  image?: string;
  buttonLink?: string;
  buttonText?: string;
  badge?: string;
  badgeColor?: string;
}

interface HeroCarouselProps {
  slides?: Slide[];
  autoPlayInterval?: number;
}

// Default slides if no API data
const defaultSlides: Slide[] = [
  {
    id: 1,
    title: 'AGRICULTURE COMPANY',
    subtitle: 'We have been producing quality crops for 50 years.',
    image: '/images/agriculture-hero.jpg',
    buttonText: 'More Info',
    buttonLink: '/about',
    badge: 'Since 1976',
    badgeColor: 'bg-green-600',
  },
  {
    id: 2,
    title: 'Quality Products',
    subtitle: 'Premium agricultural products for sustainable farming',
    image: '/images/agriculture-hero2.jpg',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    badge: 'Best Quality',
    badgeColor: 'bg-amber-600',
  },
];

export default function HeroCarousel({ slides: propSlides, autoPlayInterval = 5000 }: HeroCarouselProps) {
  const [slides, setSlides] = useState<Slide[]>(defaultSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Use ref to track if initial slides have been set
  const hasInitializedSlides = useRef(false);

  // FIX: Handle prop slides without calling setState synchronously in effect
  useEffect(() => {
    if (propSlides && propSlides.length > 0 && !hasInitializedSlides.current) {
      hasInitializedSlides.current = true;
      setSlides(propSlides);
      setLoading(false);
    }
  }, [propSlides]);

  // FIX: Fetch slides from API if not provided - using a separate effect
  useEffect(() => {
    // Don't fetch if propSlides were provided or already fetched
    if (propSlides && propSlides.length > 0) {
      return;
    }

    let isMounted = true;

    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/banners?status=ACTIVE');
        if (response.ok && isMounted) {
          const data = await response.json();
          if (data.banners && data.banners.length > 0) {
            const mappedSlides: Slide[] = data.banners.map((banner: Banner) => ({
              id: banner.id,
              title: banner.title,
              subtitle: banner.subtitle,
              image: banner.image,
              href: banner.buttonLink || '/shop',
              buttonText: banner.buttonText,
              buttonLink: banner.buttonLink,
              badge: banner.badge,
              badgeColor: banner.badgeColor,
            }));
            if (isMounted) {
              setSlides(mappedSlides);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSlides();

    return () => {
      isMounted = false;
    };
  }, [propSlides]);

  // Auto-play - this is fine because it's updating state based on external timer
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % slides.length);
    }, autoPlayInterval);
    
    return () => clearInterval(id);
  }, [isAutoPlaying, slides.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex((i) => (i === 0 ? slides.length - 1 : i - 1));
  };

  const goToNext = () => {
    setCurrentIndex((i) => (i + 1) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="relative min-h-[500px] md:min-h-[600px] bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl animate-pulse flex items-center justify-center">
        <Sprout className="w-16 h-16 text-green-400 animate-bounce" />
      </div>
    );
  }

  const slide = slides[currentIndex];

  return (
    <div
      className="relative group rounded-2xl overflow-hidden shadow-2xl"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slide Background */}
      <div className="relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
        {slide.image ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-emerald-900" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Content */}
        <div className="relative h-full flex items-center px-6 md:px-12 lg:px-20 py-12">
          <div className="max-w-3xl text-white">
            {slide.badge && (
              <span className={`inline-block ${slide.badgeColor || 'bg-green-600'} text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4`}>
                {slide.badge}
              </span>
            )}

            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold leading-tight mb-4">
              {slide.title}
            </h1>

            {slide.subtitle && (
              <p className="text-base md:text-xl text-white/90 max-w-2xl mb-6">
                {slide.subtitle}
              </p>
            )}

            <div className="flex flex-wrap gap-4">
              {slide.buttonText && slide.buttonLink && (
                <Link
                  href={slide.buttonLink}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {slide.buttonText}
                  <ChevronRight size={18} />
                </Link>
              )}
              {slide.href && !slide.buttonText && (
                <Link
                  href={slide.href}
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 border border-white/30"
                >
                  Learn More
                  <ChevronRight size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${currentIndex === index
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Slide counter */}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full z-10">
            {currentIndex + 1} / {slides.length}
          </div>
        </>
      )}
    </div>
  );
}