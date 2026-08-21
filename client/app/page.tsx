// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sprout,
  Leaf,
  Tractor,
  Sun,
  ArrowRight,
  Shield,
  Truck,
  Award,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

// ✅ Using real ProductCard component
import ProductCard from '@/components/shop/ProductCard';

// Features data
const features = [
  {
    id: 1,
    icon: <Shield className="w-8 h-8 text-green-600" />,
    title: 'Quality Guaranteed',
    description: 'Premium agricultural products from trusted suppliers',
  },
  {
    id: 2,
    icon: <Truck className="w-8 h-8 text-green-600" />,
    title: 'Fast Delivery',
    description: 'Quick and reliable delivery to your farm or business',
  },
  {
    id: 3,
    icon: <Award className="w-8 h-8 text-green-600" />,
    title: 'Best Prices',
    description: 'Competitive pricing on all agricultural supplies',
  },
  {
    id: 4,
    icon: <Clock className="w-8 h-8 text-green-600" />,
    title: '24/7 Support',
    description: 'Expert support whenever you need it',
  },
];

// HERO SLIDES using your local files
const heroSlides = [
  {
    id: 1,
    image: '/banners/images.jpeg',
  },
  {
    id: 2,
    image: '/banners/hero-farmer.jpg',
  },
  {
    id: 3,
    image: '/banners/OfLUzm2ezjHCJUvuxeMpyqItc.avif',
  },
  {
    id: 4,
    image: '/banners/TSe9c8pWQAoVr1cHJorIxnFDhg.avif',
  },
];

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  images: string[];
  category?: { name: string; id: string };
  seller?: { shopName: string };
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-green-600 p-1 flex-shrink-0">
                <Image
                  src="/banners/images.jpeg"
                  alt="GenesisAgri"
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <span className="text-xl font-bold">
                Genesis<span className="text-green-400">Agri</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Quality agricultural products for sustainable farming since 1976.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/about" className="hover:text-white hover:underline transition-colors">About Us</Link></li>
              <li><Link href="/shop" className="hover:text-white hover:underline transition-colors">Products</Link></li>
              <li><Link href="/history" className="hover:text-white hover:underline transition-colors">Our History</Link></li>
              <li><Link href="/contact" className="hover:text-white hover:underline transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-lg">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/shop" className="hover:text-white hover:underline transition-colors">Shop Online</Link></li>
              <li><Link href="/seller" className="hover:text-white hover:underline transition-colors">Sell with Us</Link></li>
              <li><Link href="/contact" className="hover:text-white hover:underline transition-colors">Customer Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-lg">Contact</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-green-400 mt-1 flex-shrink-0" />
                <span>123 Agri Street, Farm City, FC 12345</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-green-400 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-green-400 flex-shrink-0" />
                <span>info@genesisagri.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
          <p>© 2026 GenesisAgri.com, Inc. All rights reserved. Growing Together 🌱</p>
        </div>
      </div>
    </footer>
  );
}

// Main Homepage Component
export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // ✅ STATE FOR REAL PRODUCTS FROM API
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // ✅ FETCH REAL PRODUCTS FROM YOUR API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?limit=8');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const slide = heroSlides[currentSlide];

  return (
    <main className="min-h-screen">

      {/* ✅ HERO SECTION - VIDEO BACKGROUND (Using your exact video file) */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">

        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          {/* ✅ Using your exact video file from public/banners/ */}
          <source src="/banners/Video-for-web-final.mp4" type="video/mp4" />

          {/* Fallback image if video fails to load */}
          <Image
            src="/banners/images.jpeg"
            alt="Hero Fallback"
            fill
            className="object-cover"
          />
        </video>

        {/* Dark Overlay - Makes text readable */}
        <div className="absolute inset-0 bg-black/50 z-10" />

        {/* Content Overlay - Centered */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 text-center">

          {/* ✅ MINIMIZED BADGE: Smaller text, less padding */}
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-4 sm:mb-5">
            <Sprout size={12} />
            Agricultural Company
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-3 sm:mb-4">
            <span className="text-green-400">Genesis</span> Agri Business
          </h1>

          {/* ✅ MINIMIZED SUBTITLE: Smaller text */}
          <p className="text-sm sm:text-lg md:text-xl text-white/90 font-medium mb-3 sm:mb-4 max-w-2xl mx-auto">
            We have been producing quality crops for 50 years.
          </p>

          {/* ✅ MINIMIZED DESCRIPTION: Smaller text, less spacing */}
          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto mb-6 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy
            nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.
          </p>

          {/* ✅ BUTTONS: More Info (Left), Shop Now (Right) */}
          <div className="flex justify-between items-center max-w-sm mx-auto gap-4">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
            >
              More Info
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur hover:bg-white/30 text-white font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg transition-all duration-200 border border-white/30 text-sm"
            >
              Shop Now
            </Link>
          </div>
        </div>

        {/* Optional: Scroll indicator at the bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden md:block">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-3">
              Why Choose <span className="text-green-600">GenesisAgri</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide quality agricultural products and services to help your farm grow
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-xl transition-all duration-300 border border-green-100 hover:border-green-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-green-800">{feature.title}</h3>
                <p className="text-sm text-gray-500 mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ Products Section - REAL API DATA, 4 PER ROW, VERTICAL GRID */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800">
              Featured Products
            </h2>
            <p className="text-gray-500 mt-2">Quality agricultural products for your farm</p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <p>No products available</p>
            </div>
          ) : (
            /* ✅ GRID: 4 per row, stacks vertically (NO SIDEWAYS SCROLL) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  discountPrice={product.discountPrice}
                  stock={product.stock}
                  images={product.images}
                  category={product.category}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-3">
              Trusted by <span className="text-green-600">Farmers</span> Worldwide
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We've been serving the agricultural community for over five decades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle size={24} />
                <span className="font-semibold text-green-800">Quality Products</span>
              </div>
              <p className="text-gray-600 text-sm">
                We source only the highest quality agricultural products from trusted suppliers.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle size={24} />
                <span className="font-semibold text-green-800">Expert Support</span>
              </div>
              <p className="text-gray-600 text-sm">
                Our team of agricultural experts is always ready to help you.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle size={24} />
                <span className="font-semibold text-green-800">Sustainable Farming</span>
              </div>
              <p className="text-gray-600 text-sm">
                We promote sustainable farming practices for a better future.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}