// components/ImageCarousel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
}

interface ImageCarouselProps {
  slides?: Slide[];
  autoPlay?: boolean;
  interval?: number;
}

const defaultSlides: Slide[] = [
  {
    id: 1,
    image: '/images/slide1.jpg',
    title: 'Prime Day 2026',
    subtitle: 'Epic deals for Prime members',
    buttonText: 'Shop Now',
    buttonLink: '/shop'
  },
  {
    id: 2,
    image: '/images/slide2.jpg',
    title: 'Electronics Sale',
    subtitle: 'Up to 50% off on latest gadgets',
    buttonText: 'Shop Electronics',
    buttonLink: '/shop?category=electronics'
  },
  {
    id: 3,
    image: '/images/slide3.jpg',
    title: 'Fashion Week',
    subtitle: 'New arrivals up to 40% off',
    buttonText: 'Shop Fashion',
    buttonLink: '/shop?category=fashion'
  },
  {
    id: 4,
    image: '/images/slide4.jpg',
    title: 'Home & Living',
    subtitle: 'Transform your space with great deals',
    buttonText: 'Shop Home',
    buttonLink: '/shop?category=home'
  },
  {
    id: 5,
    image: '/images/slide5.jpg',
    title: 'Prime Video',
    subtitle: 'Watch exclusive content',
    buttonText: 'Explore',
    buttonLink: '/prime-video'
  }
];

export function ImageCarousel({ 
  slides = defaultSlides, 
  autoPlay = true, 
  interval = 5000 
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1
    );
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      goToNext();
    }, interval);
    
    return () => clearInterval(timer);
  }, [isAutoPlaying, goToNext, interval]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left
      goToNext();
    }
    if (touchStart - touchEnd < -75) {
      // Swipe right
      goToPrevious();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <div className="relative group">
      {/* Main Carousel Container */}
      <div 
        className="relative overflow-hidden rounded-xl shadow-lg"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Container */}
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="relative w-full flex-shrink-0 min-h-[300px] md:min-h-[400px] lg:min-h-[500px]"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${slide.image})` }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
              
              {/* Content */}
              <div className="relative h-full flex items-center px-6 md:px-12 lg:px-20">
                <div className="max-w-2xl text-white">
                  <p className="text-xs uppercase tracking-wide text-yellow-400 mb-2">
                    Coming Soon
                  </p>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
                    {slide.title}
                  </h2>
                  <p className="text-sm md:text-base lg:text-lg mb-6 text-gray-200">
                    {slide.subtitle}
                  </p>
                  {slide.buttonText && (
                    <a
                      href={slide.buttonLink}
                      className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
                    >
                      {slide.buttonText}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Auto-play Toggle */}
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200"
          aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>

      {/* Dots Navigation */}
      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-200 ${
              currentIndex === index
                ? 'w-8 bg-blue-600'
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// Prime Day Banner Component
export function PrimeDayBanner() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Save to localStorage or send to API
      localStorage.setItem('primeDayReminder', email);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setEmail('');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-lg p-5 mb-8 text-white">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide opacity-80">Coming June 23</p>
          <h3 className="text-2xl font-bold">Prime Day 2026</h3>
          <p className="opacity-90">4 days of epic deals for Prime members</p>
        </div>
        
        {submitted ? (
          <div className="bg-green-500 px-6 py-2 rounded-full text-sm font-semibold">
            ✓ Reminder set!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-4 py-2 rounded-full text-black text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-2 rounded-full transition text-sm whitespace-nowrap"
            >
              Sign up for reminders
            </button>
          </form>
        )}
      </div>
    </div>
  );
}